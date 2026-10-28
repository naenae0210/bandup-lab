from fastapi import FastAPI

app = FastAPI(title="BandUp Lab STT")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
