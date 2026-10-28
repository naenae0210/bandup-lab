from fastapi import FastAPI

app = FastAPI(title="BandUp Lab API")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
