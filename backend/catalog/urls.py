"""Catalog API routes; mounted under /api/ by config/urls.py."""

from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, CourseViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet)
router.register("courses", CourseViewSet)

urlpatterns = router.urls
