from fastapi import APIRouter, Response

from services.dgms import build_report, pdf_bytes


router = APIRouter(prefix="/api/dgms", tags=["dgms"])


@router.get("/preview")
def preview_report(form: str = "form-iv-a"):
    if form not in {"form-iv-a", "form-b"}:
        form = "form-iv-a"
    return build_report(form)


@router.get("/download")
def download_report(form: str = "form-iv-a"):
    if form not in {"form-iv-a", "form-b"}:
        form = "form-iv-a"
    report = build_report(form)
    return Response(
        content=pdf_bytes(report),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{form}-rakshaai.pdf"'},
    )
