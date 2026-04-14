"""PDF Report generation logic using fpdf2."""
from __future__ import annotations

import io
import json
from datetime import datetime
from pathlib import Path
from typing import Any

from fpdf import FPDF
from app.config import get_settings


class ReportGenerator:
    def __init__(self, scan_data: dict[str, Any], user_data: dict[str, Any]):
        self.scan = scan_data
        self.user = user_data
        self.settings = get_settings()
        self.pdf = FPDF()
        self.pdf.set_auto_page_break(auto=True, margin=15)
        self.pdf.add_page()
        
        # Colors - Slate/Indigo theme matching the UI
        self.primary_color = (79, 70, 229)  # #4f46e5 (Indigo)
        self.accent_color = (16, 185, 129)   # #10b981 (Teal)
        self.text_dark = (15, 23, 42)       # #0f172a
        self.text_muted = (71, 85, 105)     # #475569

    def _clean_text(self, text: str | None) -> str:
        """Replace unsupported Unicode characters with ASCII equivalents for core fonts."""
        if not text:
            return ""
        # Common problematic characters for Latin-1/WinAnsi fonts
        replacements = {
            "\u2014": "-",   # em-dash
            "\u2013": "-",   # en-dash
            "\u201c": '"',   # left double quote
            "\u201d": '"',   # right double quote
            "\u2018": "'",   # left single quote
            "\u2019": "'",   # right single quote
            "\u2022": "*",   # bullet
            "\u2695": "",    # medical symbol
            "\u26a0": "",    # warning sign
            "\u26a1": "",    # lightning
            "\u2713": "v",   # check mark
            "\u00a0": " ",   # non-breaking space
        }
        for old, new in replacements.items():
            text = text.replace(old, new)
        
        # Strip any other non-Latin-1 characters to avoid fpdf errors
        return text.encode("latin-1", "replace").decode("latin-1")

    def _draw_header(self):
        # Logo placeholder (Indigo dot)
        self.pdf.set_fill_color(*self.primary_color)
        self.pdf.circle(15, 15, 3, style="F")
        
        # Brand Name
        self.pdf.set_font("Helvetica", "B", 16)
        self.pdf.set_text_color(*self.primary_color)
        self.pdf.set_xy(20, 12)
        self.pdf.cell(0, 10, "NeuroDermAI", ln=True)
        
        # Subtitle
        self.pdf.set_font("Helvetica", "", 10)
        self.pdf.set_text_color(*self.text_muted)
        self.pdf.set_xy(20, 18)
        self.pdf.cell(0, 10, "Clinical Screening Intelligence", ln=True)
        
        # Report Title
        self.pdf.set_font("Helvetica", "B", 22)
        self.pdf.set_text_color(*self.text_dark)
        self.pdf.set_y(35)
        self.pdf.cell(0, 15, "Clinical Screening Report", align="C", ln=True)
        
        # Divider Line
        self.pdf.set_draw_color(226, 232, 240)
        self.pdf.line(10, 52, 200, 52)

    def _draw_metadata(self):
        self.pdf.set_y(60)
        self.pdf.set_font("Helvetica", "B", 11)
        self.pdf.set_text_color(*self.text_dark)
        
        # Two-column layout for metadata
        col1_x = 15
        col2_x = 110
        
        # Column 1
        self.pdf.set_xy(col1_x, 60)
        self.pdf.cell(30, 8, "Patient Name:")
        self.pdf.set_font("Helvetica", "", 11)
        self.pdf.cell(0, 8, self._clean_text(self.user.get("name", "Unknown User")), ln=True)
        
        self.pdf.set_font("Helvetica", "B", 11)
        self.pdf.set_x(col1_x)
        self.pdf.cell(30, 8, "Patient Email:")
        self.pdf.set_font("Helvetica", "", 11)
        self.pdf.cell(0, 8, self._clean_text(self.user.get("email", "N/A")), ln=True)
        
        # Column 2
        date_obj = datetime.fromisoformat(self.scan["created_at"].replace("Z", "+00:00"))
        formatted_date = date_obj.strftime("%b %d, %Y - %H:%M UTC")
        
        self.pdf.set_xy(col2_x, 60)
        self.pdf.set_font("Helvetica", "B", 11)
        self.pdf.cell(30, 8, "Report Date:")
        self.pdf.set_font("Helvetica", "", 11)
        self.pdf.cell(0, 8, formatted_date, ln=True)
        
        self.pdf.set_xy(col2_x, 68)
        self.pdf.set_font("Helvetica", "B", 11)
        self.pdf.cell(30, 8, "Scan ID:")
        self.pdf.set_font("Helvetica", "", 11)
        self.pdf.cell(0, 8, f"ND-{self.scan['id']:06d}", ln=True)

    def _draw_image(self):
        image_filename = self.scan.get("image_filename")
        if not image_filename:
            return
            
        image_path = self.settings.scan_uploads_dir / image_filename
        if not image_path.exists():
            return
            
        # Draw image box
        self.pdf.set_y(85)
        self.pdf.set_draw_color(226, 232, 240)
        self.pdf.rect(55, 85, 100, 75)
        
        # Add the image
        try:
            # fpdf2 manages aspect ratio automatically if only one dimension is provided
            self.pdf.image(str(image_path), x=56, y=86, w=98, h=73)
        except Exception:
            self.pdf.set_xy(55, 120)
            self.pdf.set_font("Helvetica", "I", 10)
            self.pdf.cell(100, 10, "[Image could not be rendered]", align="C")

    def _draw_analysis_summary(self):
        self.pdf.set_y(170)
        
        # Heading
        self.pdf.set_font("Helvetica", "B", 14)
        self.pdf.set_text_color(*self.primary_color)
        self.pdf.cell(0, 10, "1. Screening Summary", ln=True)
        
        # Top Prediction Box
        self.pdf.set_fill_color(248, 250, 252)
        self.pdf.rect(15, 182, 180, 25, style="F")
        self.pdf.set_draw_color(79, 70, 229)
        self.pdf.set_line_width(0.5)
        self.pdf.rect(15, 182, 180, 25)
        self.pdf.set_line_width(0.2)
        
        label = self.scan.get("predicted_class", "Unknown").replace("_", " ").title()
        confidence = self.scan.get("confidence", 0.0)
        
        self.pdf.set_xy(25, 185)
        self.pdf.set_font("Helvetica", "B", 10)
        self.pdf.set_text_color(*self.text_muted)
        self.pdf.cell(0, 8, "PRIMARY MATCH DETECTED:")
        
        self.pdf.set_xy(25, 193)
        self.pdf.set_font("Helvetica", "B", 18)
        self.pdf.set_text_color(*self.text_dark)
        self.pdf.cell(100, 10, self._clean_text(label))
        
        self.pdf.set_xy(145, 193)
        self.pdf.set_font("Helvetica", "B", 18)
        self.pdf.set_text_color(*self.accent_color)
        self.pdf.cell(40, 10, f"{confidence*100:.1f}%", align="R")
        
        # Top 3 candidates
        self.pdf.set_y(215)
        self.pdf.set_font("Helvetica", "B", 11)
        self.pdf.set_text_color(*self.text_dark)
        self.pdf.cell(0, 8, "Top 3 Candidates Identified:", ln=True)
        
        top_3 = self.scan.get("top_3", [])
        for item in top_3:
            label_clean = item["label"].replace("_", " ").title()
            prob_percent = f"{item['probability']*100:.1f}%"
            
            self.pdf.set_x(25)
            self.pdf.set_font("Helvetica", "", 10)
            self.pdf.set_text_color(*self.text_muted)
            self.pdf.cell(80, 7, self._clean_text(f"- {label_clean}"))
            self.pdf.set_font("Helvetica", "B", 10)
            self.pdf.cell(20, 7, prob_percent, ln=True)

    def _draw_clinical_guidance(self):
        self.pdf.add_page()
        self.pdf.set_y(20)
        
        # Heading
        self.pdf.set_font("Helvetica", "B", 14)
        self.pdf.set_text_color(*self.primary_color)
        self.pdf.cell(0, 10, "2. Educational Guidance", ln=True)
        
        # Explanation
        self.pdf.set_y(35)
        self.pdf.set_font("Helvetica", "B", 11)
        self.pdf.set_text_color(*self.text_dark)
        self.pdf.cell(0, 8, "Understanding the detected pattern:", ln=True)
        
        self.pdf.set_font("Helvetica", "", 10)
        self.pdf.set_text_color(*self.text_muted)
        explanation = self.scan.get("explanation", "No detailed explanation available for this condition.")
        self.pdf.multi_cell(0, 6, self._clean_text(explanation))
        
        # Precautions
        self.pdf.set_y(self.pdf.get_y() + 10)
        self.pdf.set_font("Helvetica", "B", 11)
        self.pdf.set_text_color(*self.text_dark)
        self.pdf.cell(0, 8, "General Educational Precautions:", ln=True)
        
        self.pdf.set_font("Helvetica", "", 10)
        self.pdf.set_text_color(*self.text_muted)
        precautions = self.scan.get("precautions", [])
        if isinstance(precautions, str):
            try:
                precautions = json.loads(precautions)
            except:
                precautions = [precautions]
                
        if not precautions:
            self.pdf.cell(0, 6, "Consult with a medical professional for specific precautions.", ln=True)
        else:
            for p in precautions:
                self.pdf.set_x(20)
                self.pdf.multi_cell(0, 6, self._clean_text(f"* {p}"))

    def _draw_user_notes(self):
        notes = self.scan.get("user_notes")
        if not notes:
            return
            
        self.pdf.set_y(self.pdf.get_y() + 15)
        
        # Heading
        self.pdf.set_font("Helvetica", "B", 14)
        self.pdf.set_text_color(*self.primary_color)
        self.pdf.cell(0, 10, "3. User Observations / Notes", ln=True)
        
        self.pdf.set_y(self.pdf.get_y() + 5)
        self.pdf.set_fill_color(255, 251, 235) # Light amber background for notes
        self.pdf.set_draw_color(251, 191, 36)
        
        # Measure height needed
        self.pdf.set_font("Helvetica", "", 10)
        self.pdf.set_text_color(*self.text_dark)
        
        # Draw notes box
        self.pdf.multi_cell(0, 6, self._clean_text(notes), border=1, fill=True)

    def _draw_footer(self):
        # Disclaimer - always at bottom of current page or new page if no space
        if self.pdf.get_y() > 240:
            self.pdf.add_page()
            
        self.pdf.set_y(255)
        self.pdf.set_draw_color(245, 158, 11)
        self.pdf.line(10, 255, 200, 255)
        
        self.pdf.set_y(260)
        self.pdf.set_font("Helvetica", "B", 9)
        self.pdf.set_text_color(180, 83, 9) # Dark amber
        self.pdf.cell(0, 5, "SCREENING DISCLAIMER", align="C", ln=True)
        
        self.pdf.set_font("Helvetica", "", 7.5)
        self.pdf.set_text_color(*self.text_muted)
        disclaimer = self.scan.get("disclaimer", "Educational screening tool only. Not a medical diagnosis.")
        self.pdf.multi_cell(0, 4, self._clean_text(disclaimer), align="C")
        
        # End notice
        self.pdf.set_y(280)
        self.pdf.set_font("Helvetica", "I", 8)
        self.pdf.cell(0, 5, self._clean_text(f"Document Generated by NeuroDermAI on {datetime.now().strftime('%Y-%m-%d %H:%M')}"), align="C")

    def generate(self) -> bytes:
        """Generate the PDF and return as bytes."""
        self._draw_header()
        self._draw_metadata()
        self._draw_image()
        self._draw_analysis_summary()
        self._draw_clinical_guidance()
        self._draw_user_notes()
        self._draw_footer()
        
        # Return as bytes
        return self.pdf.output()
