import pymupdf as fitz

class PDFParserService:
    def extract_text(self, file_bytes: bytes) -> str:
        doc = fitz.open(stream=file_bytes, filetype="pdf")

        MAX_PAGES = 10
        if len(doc) > MAX_PAGES:
            raise ValueError(f"PDF too long (max {MAX_PAGES} pages)")

        text = ""
        for page in doc:
            text += page.get_text("text") + "\n"

        return text
