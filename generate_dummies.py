import os
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = r"c:\Users\HP\Desktop\Sarathi\dummy_documents"

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

# 10 sets of users
users = [
    "Rajesh_Kumar", "Sita_Devi", "Amit_Sharma", "Priya_Patel", "Ramesh_Singh", 
    "Geeta_Rao", "Suresh_Naidu", "Kavita_Verma", "Anil_Desai", "Meena_Kumari"
]

doc_types = [
    ("Aadhaar", "#1e3a8a", "Identity Document"),
    ("Income_Certificate", "#10b981", "Financial Document"),
    ("BPL_Card", "#f59e0b", "Financial Document"),
    ("Caste_Certificate", "#8b5cf6", "Identity Document"),
    ("Bank_Passbook", "#mgnrega", "Financial Document"),
    ("Land_Record", "#ec4899", "Property Document"),
    ("Disability_Cert", "#ef4444", "Medical Document"),
    ("Residence_Proof", "#6b7280", "Identity Document"),
]

def create_dummy_doc(name, doc_type, color, subtitle):
    # A4 size roughly at 72dpi
    width, height = 595, 842
    img = Image.new('RGB', (width, height), color='white')
    d = ImageDraw.Draw(img)
    
    # Background color mapping for simplicity as we can't use hex directly in old PIL without conversion easily, handling basic hex
    try:
        bg_color = color if color.startswith('#') else 'blue'
    except:
        bg_color = 'blue'
        
    if color == '#mgnrega': bg_color = '#059669'

    # Draw a header box
    d.rectangle([(0, 0), (width, 150)], fill=bg_color)
    
    # We will just rely on default font
    # Draw text
    d.text((50, 50), f"GOVERNMENT OF INDIA", fill="white")
    d.text((50, 80), f"{doc_type.replace('_', ' ').upper()}", fill="white")
    
    d.text((50, 200), f"Name: {name.replace('_', ' ')}", fill="black")
    d.text((50, 240), f"Category: {subtitle}", fill="black")
    d.text((50, 280), f"Status: Verified", fill="black")
    
    # some fake data lines
    for i in range(5):
        d.rectangle([(50, 350 + i*40), (width-50, 370 + i*40)], fill="#e2e8f0")
        
    filename = f"{name}_{doc_type}.png"
    filepath = os.path.join(OUTPUT_DIR, filename)
    img.save(filepath)

print("Generating dummy documents...")
for user in users:
    for dtype, color, sub in doc_types:
        create_dummy_doc(user, dtype, color, sub)

print(f"Generated {len(users) * len(doc_types)} dummy documents in {OUTPUT_DIR}")
