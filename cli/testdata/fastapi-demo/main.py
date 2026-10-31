from fastapi import FastAPI
from routes.users import router

app = FastAPI()
app.include_router(router, prefix="/api")

@app.get("/health")
def health():
    pass
