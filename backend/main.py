from fastapi import FastAPI, Request
import subprocess

app = FastAPI()

@app.post("/webhook")
async def github_webhook(request: Request):
    payload = await request.json()

    # Optional: check branch
    if payload["ref"] == "refs/heads/main":
        subprocess.run(["git", "pull"], cwd="/home/ec2-user/")

    return {"status": "ok"}

@app.get("/")
def read_root():
    return {"message": "Server running"}