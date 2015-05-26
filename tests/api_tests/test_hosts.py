import json
import pytest
import requests

from .fixtures import tornado_server, tornado_app
from .util import (
    assert_error, assert_success, assert_created, assert_deleted, Client
)


def test_malformed(tornado_server):
    client = Client(tornado_server)
    assert_error(client.post("/hosts", data="Non-JSON"), 400)


def test_creation(tornado_server):
    client = Client(tornado_server)
    assert_success(client.get("/hosts"), {
        "hosts": [],
        "href": "/api/v1/hosts",
        "limit": 10,
        "offset": 0,
        "totalHosts": 0,
    })

    assert_created(
        client.create("/hosts", hostname="example"), "/api/v1/hosts/example"
    )
    assert_error(client.create("/hosts", hostname="example"), 409)

    assert_success(
        client.get("/hosts"),
        {
            "href": "/api/v1/hosts",
            "hosts": [{
                          "id": 1,
                          "href": "/api/v1/hosts/example",
                          "hostname": "example"
                      }],
            "limit": 10,
            "offset": 0,
            "totalHosts": 1,
        }
    )

    assert_success(
        client.get("/hosts/example"),
        {
            "id": 1,
            "href": "/api/v1/hosts/example",
            "hostname": "example",
            "events": [],
            "labors": [],
            "quests": [],
            "lastEvent": None,
            "limit": 10,
            "offset": 0,
        }
    )

    assert_created(client.create("/hosts", hostname="sample"), "/api/v1/hosts/sample")
    assert_success(
        client.get("/hosts", params={"hostname": "sample"}),
        {
            "href": "/api/v1/hosts?hostname=sample",
            "hosts": [{
                          "id": 2,
                          "href": "/api/v1/hosts/sample",
                          "hostname": "sample"
                      }],
            "limit": 10,
            "offset": 0,
            "totalHosts": 1
        }
    )


def test_update(tornado_server):
    client = Client(tornado_server)

    client.create("/hosts", hostname="testname")

    assert_success(
        client.update("/hosts/testname", hostname="newname"),
        {
            "id": 1,
            "href": "/api/v1/hosts/newname",
            "hostname": "newname"
        }
    )

    assert_error(client.update("/hosts/newname"), 400)