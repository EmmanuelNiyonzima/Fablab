from app.extensions import db
from app.models.user import Role, User


def test_login_and_current_user(client, app):
    with app.app_context():
        user = User(
            name="Finance Manager",
            email="finance@example.com",
            role=Role.FINANCE_MANAGER.value,
        )
        user.set_password("safe-test-password")
        db.session.add(user)
        db.session.commit()

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "FINANCE@example.com", "password": "safe-test-password"},
    )

    assert login_response.status_code == 200
    token = login_response.get_json()["token"]
    me_response = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )

    assert me_response.status_code == 200
    assert me_response.get_json()["user"]["email"] == "finance@example.com"


def test_login_rejects_unknown_user(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "unknown@example.com", "password": "not-a-real-password"},
    )

    assert response.status_code == 401
    assert response.get_json() == {"error": "Invalid email or password."}
