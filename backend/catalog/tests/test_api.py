import pytest
from django.contrib.auth import get_user_model
from django.db import connection
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient

from catalog.models import Category, Course


@pytest.fixture
def client() -> APIClient:
    return APIClient()


@pytest.fixture
def auth_client(client: APIClient) -> APIClient:
    get_user_model().objects.create_user(username="student", password="pw-12345!")
    resp = client.post("/api/token/", {"username": "student", "password": "pw-12345!"})
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")
    return client


def make_courses(n: int, prefix: str) -> None:
    for i in range(n):
        cat = Category.objects.create(name=f"{prefix} {i}")
        Course.objects.create(code=f"{prefix}{i:03}", title=f"Course {i}", credits=3, category=cat)


@pytest.mark.django_db
@pytest.mark.parametrize("url", ["/api/courses/", "/api/categories/"])
def test_catalog_requires_auth(client: APIClient, url: str) -> None:
    assert client.get(url).status_code == 401


@pytest.mark.django_db
def test_course_list_query_count_does_not_grow_with_rows(auth_client: APIClient) -> None:
    make_courses(2, prefix="A")
    with CaptureQueriesContext(connection) as small:
        assert auth_client.get("/api/courses/").status_code == 200

    make_courses(10, prefix="B")
    with CaptureQueriesContext(connection) as large:
        resp = auth_client.get("/api/courses/")

    assert resp.data["count"] == 12
    assert resp.data["results"][0]["category_name"]
    # One category per course, so an N+1 would add 10 queries here.
    assert len(large) == len(small)
