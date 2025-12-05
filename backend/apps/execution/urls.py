from django.urls import path
from .views import RunCodeView

urlpatterns = [
    path("run/", RunCodeView.as_view(), name="run_code"),
]
