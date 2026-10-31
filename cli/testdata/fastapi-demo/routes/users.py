from fastapi import APIRouter

router = APIRouter(prefix="/v1")

@router.get("/users/{user_id}")
def get_user():
    pass

@router.api_route("/users", methods=["GET", "POST"])
def users():
    pass
