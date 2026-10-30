import io
import zlib
import re

try:
    import pymupdf as fitz
except ImportError:
    try:
        import fitz
    except ImportError:
        fitz = None

try:
    import pypdf
except ImportError:
    pypdf = None

try:
    from docx import Document
except ImportError:
    Document = None

def extract_pdf_native(data: bytes) -> str:
    extracted = []
    streams = re.findall(rb'stream[\r\n]+(.*?)[\r\n]+endstream', data, re.DOTALL)
    for s in streams:
        decomp = None
        try:
            decomp = zlib.decompress(s)
        except Exception:
            try:
                decomp = zlib.decompress(s, -zlib.MAX_WBITS)
            except Exception:
                decomp = s

        if decomp:
            for block in re.findall(rb'\[(.*?)\]\s*TJ', decomp, re.DOTALL):
                for item in re.findall(rb'\((.*?)\)', block):
                    t = item.decode('utf-8', errors='ignore').strip()
                    if len(t) > 0:
                        extracted.append(t)

            for item in re.findall(rb'\((.*?)\)\s*Tj', decomp):
                t = item.decode('utf-8', errors='ignore').strip()
                if len(t) > 0:
                    extracted.append(t)

    if not extracted:
        raw_words = re.findall(rb'[a-zA-Z0-9+#.-]{2,}', data)
        for w in raw_words:
            t = w.decode('utf-8', errors='ignore').strip()
            if len(t) > 1:
                extracted.append(t)

    return " ".join(extracted)

def extract_text_from_pdf(file_bytes: bytes) -> str:
    if fitz:
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            if doc.is_encrypted:
                raise ValueError("The PDF is password-protected. Please upload an unencrypted document.")
            text_parts = []
            for page in doc:
                t = page.get_text()
                if t:
                    text_parts.append(t)
            extracted = "\n".join(text_parts).strip()
            if extracted:
                return extracted
        except ValueError:
            raise
        except Exception:
            pass

    if pypdf:
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            text_parts = []
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    text_parts.append(t)
            extracted = "\n".join(text_parts).strip()
            if extracted:
                return extracted
        except Exception:
            pass

    native_text = extract_pdf_native(file_bytes)
    if native_text.strip():
        return native_text.strip()

    raise ValueError("Could not extract text from the PDF. If this is a scanned image, please upload a text-based PDF or DOCX.")

def extract_text_from_docx(file_bytes: bytes) -> str:
    if not Document:
        raise ImportError("python-docx is not installed. Please run 'pip install python-docx'.")

    try:
        doc = Document(io.BytesIO(file_bytes))
    except Exception:
        raise ValueError("The DOCX file appears corrupted or invalid. Please upload a valid Word document.")

    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    for table in doc.tables:
        for row in table.rows:
            row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if row_text:
                paragraphs.append(" | ".join(row_text))

    extracted = "\n".join(paragraphs).strip()
    if not extracted:
        raise ValueError("The uploaded DOCX file is empty or contains no readable text.")

    return extracted

def extract_text(filename: str, file_bytes: bytes) -> str:
    if not file_bytes or len(file_bytes) == 0:
        raise ValueError("The uploaded file is empty (0 bytes).")

    lower_name = filename.lower()
    if lower_name.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif lower_name.endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    else:
        raise ValueError("Unsupported format. Only PDF (.pdf) and Microsoft Word (.docx) files are supported.")
