"""
Custom cursor-based pagination for efficient large dataset handling.
Uses created_at timestamp for ordering and cursor encoding.
"""

import base64
import json
from datetime import datetime
from typing import Optional, Tuple, List, Any
from django.db.models import QuerySet


class CursorPagination:
    """
    Cursor-based pagination for constant-time performance on large datasets.

    Benefits over offset pagination:
    - Constant time complexity O(1) vs O(n)
    - No duplicate/missing items when data changes
    - Better performance with large offsets
    """

    def __init__(
        self,
        page_size: int = 20,
        max_page_size: int = 50,
        ordering: str = "-created_at",
    ):
        self.page_size = page_size
        self.max_page_size = max_page_size
        self.ordering = ordering
        self.is_reversed = ordering.startswith("-")
        self.field_name = ordering.lstrip("-")

    def encode_cursor(self, obj: Any) -> str:
        """Encode cursor from last object in current page."""
        cursor_data = {
            "created_at": getattr(obj, self.field_name).isoformat(),
            "id": obj.id,  # Include ID for uniqueness
        }
        json_str = json.dumps(cursor_data)
        return base64.b64encode(json_str.encode()).decode()

    def decode_cursor(self, cursor: str) -> dict:
        """Decode cursor to extract filtering criteria."""
        try:
            json_str = base64.b64decode(cursor.encode()).decode()
            data = json.loads(json_str)
            # Convert ISO format back to datetime
            data["created_at"] = datetime.fromisoformat(data["created_at"])
            return data
        except (ValueError, KeyError) as e:
            raise ValueError(f"Invalid cursor: {e}")

    def paginate(
        self,
        queryset: QuerySet,
        cursor: Optional[str] = None,
        page_size: Optional[int] = None,
    ) -> Tuple[List[Any], Optional[str], Optional[str]]:
        """
        Paginate queryset using cursor.

        Args:
            queryset: Django queryset to paginate
            cursor: Optional cursor for pagination position
            page_size: Optional custom page size (capped at max_page_size)

        Returns:
            Tuple of (items, next_cursor, previous_cursor)
        """
        # Validate and set page size
        if page_size is not None:
            page_size = min(page_size, self.max_page_size)
        else:
            page_size = self.page_size

        # Apply cursor filtering if provided
        if cursor:
            decoded = self.decode_cursor(cursor)
            if self.is_reversed:
                # For descending order: created_at < cursor_value
                queryset = queryset.filter(
                    **{f"{self.field_name}__lt": decoded["created_at"]}
                )
            else:
                # For ascending order: created_at > cursor_value
                queryset = queryset.filter(
                    **{f"{self.field_name}__gt": decoded["created_at"]}
                )

        # Fetch page_size + 1 to check if there's a next page
        items = list(queryset.order_by(self.ordering, "id")[: page_size + 1])

        # Check if there are more items
        has_next = len(items) > page_size
        if has_next:
            items = items[:page_size]

        # Generate next cursor
        next_cursor = self.encode_cursor(items[-1]) if has_next and items else None

        # For simplicity, we don't support previous cursor in this implementation
        # It would require reverse ordering and additional logic
        previous_cursor = None

        return items, next_cursor, previous_cursor

    def get_paginated_response(
        self, data: List[dict], next_cursor: Optional[str]
    ) -> dict:
        """
        Format paginated response.

        Returns:
            Dict with results, next cursor, and metadata
        """
        return {"results": data, "next": next_cursor, "page_size": self.page_size}
