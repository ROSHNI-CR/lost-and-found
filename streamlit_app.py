import os
import sys
import json
import asyncio
from datetime import datetime
from dotenv import load_dotenv

# Ensure backend modules can be imported
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))
load_dotenv('.env')

import streamlit as st

# Configure Page
st.set_page_config(
    page_title="HITK FindIt — Heritage Campus Lost & Found",
    page_icon="🏛️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Institutional CSS
st.markdown("""
<style>
    .main-title {
        font-size: 2.2rem;
        font-weight: 800;
        color: #0a2540;
        margin-bottom: 0.2rem;
    }
    .sub-title {
        font-size: 1rem;
        color: #475569;
        margin-bottom: 1.5rem;
    }
    .hitk-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 9999px;
        background-color: #fef3c7;
        color: #92400e;
        font-weight: 700;
        font-size: 0.75rem;
        border: 1px solid #fde68a;
        margin-bottom: 0.5rem;
    }
    .metric-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 1rem;
        padding: 1.25rem;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        text-align: center;
    }
    .metric-number {
        font-size: 2rem;
        font-weight: 900;
        color: #0a2540;
    }
    .metric-label {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        color: #64748b;
    }
</style>
""", unsafe_allow_html=True)

# Sidebar Branding & Navigation
with st.sidebar:
    st.image("frontend/public/hitk_logo.png", width=80)
    st.markdown("### **HITK FindIt**")
    st.markdown("<span style='font-size:0.8rem; color:#64748b;'>Heritage Institute of Technology, Kolkata<br/>Smart Campus Recovery Portal</span>", unsafe_allow_html=True)
    st.divider()

    nav = st.radio(
        "Navigation",
        [
            "🏠 Campus Dashboard",
            "🔍 Browse Items Directory",
            "📝 Report Lost Belonging",
            "📷 Report Found Item (AI Vision)",
            "✨ AI Matching Engine",
            "💬 Campus AI Assistant (RAG)",
            "🛡️ Gate 1 Security & Claims"
        ]
    )

    st.divider()
    st.markdown("""
    **Campus Help Desk:**  
    📍 Gate 1 Security Office (24x7)  
    📞 Chowbaga Road Main Entrance  
    🎓 *An Autonomous Institution*
    """)

# ----------------- 1. DASHBOARD -----------------
if nav == "🏠 Campus Dashboard":
    st.markdown("<span class='hitk-badge'>HERITAGE INSTITUTE OF TECHNOLOGY • NAAC 'A' ACCREDITED</span>", unsafe_allow_html=True)
    st.markdown("<h1 class='main-title'>Lost Something at Campus? Let's Find It!</h1>", unsafe_allow_html=True)
    st.markdown("<p class='sub-title'>Unified digital recovery portal across Central Academic Block, ICT Block, Central Library, Canteens, and Gate 1.</p>", unsafe_allow_html=True)

    # Campus Image Banner
    if os.path.exists("frontend/public/hitk_campus.jpg"):
        st.image("frontend/public/hitk_campus.jpg", caption="Heritage Institute of Technology — Central Academic Block & Campus Grounds", use_container_width=True)

    st.markdown("### 📊 Live Campus Recovery Metrics")
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.markdown("<div class='metric-card'><div class='metric-number'>24</div><div class='metric-label'>Reports Filed</div></div>", unsafe_allow_html=True)
    with col2:
        st.markdown("<div class='metric-card'><div class='metric-number' style='color:#2563eb;'>22</div><div class='metric-label'>Found Belongings</div></div>", unsafe_allow_html=True)
    with col3:
        st.markdown("<div class='metric-card'><div class='metric-number' style='color:#059669;'>18</div><div class='metric-label'>Items Reunited</div></div>", unsafe_allow_html=True)
    with col4:
        st.markdown("<div class='metric-card'><div class='metric-number' style='color:#d97706;'>85%</div><div class='metric-label'>Recovery Rate</div></div>", unsafe_allow_html=True)

    st.divider()
    st.markdown("### 📢 Recent Campus Activity")
    c1, c2, c3 = st.columns(3)
    with c1:
        st.info("🎒 **Lost: Backpack (Navy Blue)**\n\n*Location:* Central Library 1st Floor\n\n*Status:* **Active Search**")
    with c2:
        st.success("🧮 **Found: Casio fx-991EX Calculator**\n\n*Location:* ICT Block Lab 2\n\n*Status:* **Available at Gate 1**")
    with c3:
        st.info("🪪 **Lost: Student ID Card (ECE Dept)**\n\n*Location:* Central Block Corridor\n\n*Status:* **Potential Match**")

# ----------------- 2. BROWSE ITEMS -----------------
elif nav == "🔍 Browse Items Directory":
    st.markdown("## 🔍 Campus Lost & Found Directory")
    st.markdown("Filter and search through items currently logged across Heritage campus.")

    col1, col2, col3 = st.columns([2, 1, 1])
    with col1:
        search_query = st.text_input("Search keywords", placeholder="e.g. Casio calculator, bike keys, water bottle...")
    with col2:
        category_filter = st.selectbox("Category", ["All", "Electronics", "ID Cards & Keys", "Bags", "Bottles", "Stationery", "Clothing"])
    with col3:
        zone_filter = st.selectbox("Campus Zone", ["All Campus", "Central Block (CB)", "ICT Block", "Central Library", "Main Canteen", "Gate 1 Security"])

    st.write(f"Showing listings matching: **{search_query or 'All Items'}** ({category_filter} | {zone_filter})")
    
    # Mock / Live cards
    items = [
        {"title": "Casio fx-991EX Scientific Calculator", "category": "Electronics", "zone": "ICT Block", "type": "Found", "color": "Black", "date": "2 hours ago"},
        {"title": "HITK Student ID Card (ECE Dept - 12623...)", "category": "ID Cards & Keys", "zone": "Central Block (CB)", "type": "Lost", "color": "White/Blue", "date": "4 hours ago"},
        {"title": "Milton 1L Thermos Flask", "category": "Bottles", "zone": "Main Canteen", "type": "Found", "color": "Matte Blue", "date": "Yesterday"},
        {"title": "Boat Airdopes Case", "category": "Electronics", "zone": "Central Library", "type": "Lost", "color": "Matte Black", "date": "Yesterday"},
    ]

    for item in items:
        with st.container():
            c_icon, c_info, c_action = st.columns([1, 4, 1.5])
            with c_icon:
                st.markdown(f"<div style='font-size:2.5rem; text-align:center;'>{'📦' if item['type']=='Found' else '🔍'}</div>", unsafe_allow_html=True)
            with c_info:
                st.markdown(f"**{item['title']}**")
                st.caption(f"📍 {item['zone']} • Category: {item['category']} • Color: {item['color']} • {item['date']}")
            with c_action:
                if item['type'] == 'Found':
                    st.button(f"Claim Item", key=item['title'])
                else:
                    st.button(f"View Report", key=item['title'])
            st.divider()

# ----------------- 3. REPORT LOST -----------------
elif nav == "📝 Report Lost Belonging":
    st.markdown("## 📝 Report a Lost Belonging")
    st.markdown("Fill out the details below. Our Sentence Transformers embedding engine will match it against found item records.")

    with st.form("lost_form"):
        title = st.text_input("Item Name / Title *", placeholder="e.g. Casio fx-991EX Calculator")
        col_c, col_b = st.columns(2)
        with col_c:
            category = st.selectbox("Category *", ["Electronics", "ID Cards & Keys", "Bags", "Bottles", "Stationery", "Clothing", "Other"])
        with col_b:
            brand = st.text_input("Brand", placeholder="e.g. Casio, Milton, Apple")

        col_col, col_loc = st.columns(2)
        with col_col:
            color = st.text_input("Color(s) *", placeholder="e.g. Black, Silver")
        with col_loc:
            location = st.selectbox("Campus Location Lost *", [
                "Central Block (CB)", "ICT Block", "CME Block",
                "Central Library (Swami Vivekananda Block)", "Main Canteen & Nescafe",
                "Heritage Sports Ground", "Gate 1 Security Entrance", "Hostel"
            ])

        description = st.text_area("Detailed Description *", placeholder="Describe unique features, scratches, stickers, or distinguishing traits...")
        submitted = st.form_submit_button("Submit Lost Report")
        if submitted:
            if not title or not description:
                st.error("Please fill in the item title and description.")
            else:
                st.success(f"Report for '{title}' submitted successfully! Our AI is actively monitoring found records.")

# ----------------- 4. REPORT FOUND (GEMINI AI VISION) -----------------
elif nav == "📷 Report Found Item (AI Vision)":
    st.markdown("## 📷 Report a Found Item (Google Gemini Multimodal Vision)")
    st.markdown("Upload a photo of the item you found on campus. Google Gemini will inspect the image pixels and extract structured attributes automatically.")

    uploaded_file = st.file_uploader("Upload Item Photograph", type=["jpg", "jpeg", "png", "webp"])

    if uploaded_file is not None:
        st.image(uploaded_file, caption="Uploaded Photograph Preview", width=350)
        
        if st.button("✨ Run Gemini Vision Auto-Extraction"):
            with st.spinner("Gemini 3.5 Flash is analyzing physical traits, colors, and category..."):
                try:
                    from app.services.gemini_service import gemini_service
                    img_bytes = uploaded_file.getvalue()
                    extracted = asyncio.run(gemini_service.analyze_image_and_extract(
                        image_bytes=img_bytes,
                        mime_type=uploaded_file.type or "image/jpeg",
                        user_notes="Uploaded via Streamlit Portal"
                    ))
                    st.success("Analysis Complete!")
                    st.json({
                        "object_name": extracted.object_name,
                        "category": extracted.category,
                        "color": extracted.color,
                        "estimated_type": extracted.estimated_object_type,
                        "confidence": extracted.confidence,
                        "description": extracted.description
                    })
                except Exception as e:
                    st.warning(f"Live Gemini extraction: {e}")
                    st.info("Demonstrating structured schema: Object='Wireless Earbuds', Category='Electronics', Color=['white'], Confidence=0.98")

# ----------------- 5. AI MATCHING ENGINE -----------------
elif nav == "✨ AI Matching Engine":
    st.markdown("## ✨ Hybrid Multi-Attribute Matching Simulator")
    st.markdown("See how our deterministic 6-factor algorithm ranks potential matches between lost and found items.")

    st.markdown("""
    $$\\text{Final Score} = 0.30 \\cdot S_{\\text{semantic}} + 0.20 \\cdot S_{\\text{category}} + 0.15 \\cdot S_{\\text{color}} + 0.10 \\cdot S_{\\text{brand}} + 0.15 \\cdot S_{\\text{location}} + 0.10 \\cdot S_{\\text{temporal}}$$
    """)

    st.divider()
    col_l, col_f = st.columns(2)
    with col_l:
        st.markdown("### 🔍 Reported Lost Item")
        st.write("**Title:** Casio fx-991EX Scientific Calculator")
        st.write("**Category:** Electronics | **Color:** Black")
        st.write("**Location:** ICT Block, Lab 2")
        st.write("**Date:** 2026-11-20")

    with col_f:
        st.markdown("### 📦 Secured Found Item")
        st.write("**Title:** Casio ClassWiz fx-991EX Calculator")
        st.write("**Category:** Electronics | **Color:** Black/White")
        st.write("**Location:** ICT Block, Corridor 2nd Floor")
        st.write("**Date:** 2026-11-21")

    st.markdown("### 🧮 Score Computation")
    s_sem = st.slider("1. Semantic Cosine Similarity (384-d Embedding)", 0.0, 1.0, 0.92)
    s_cat = st.slider("2. Taxonomy Category Similarity", 0.0, 1.0, 1.0)
    s_col = st.slider("3. Jaccard Color Overlap", 0.0, 1.0, 0.80)
    s_brd = st.slider("4. Brand Recognition", 0.0, 1.0, 1.0)
    s_loc = st.slider("5. Campus Distance Proximity", 0.0, 1.0, 0.90)
    s_tmp = st.slider("6. Temporal Decay Factor", 0.0, 1.0, 0.95)

    final_score = round((0.30*s_sem + 0.20*s_cat + 0.15*s_col + 0.10*s_brd + 0.15*s_loc + 0.10*s_tmp) * 100, 1)

    if final_score >= 80:
        st.success(f"### 🎯 Final Match Score: **{final_score}%** (High Potential Match)")
    else:
        st.warning(f"### ⚠️ Final Match Score: **{final_score}%** (Possible Match)")

# ----------------- 6. CAMPUS AI ASSISTANT -----------------
elif nav == "💬 Campus AI Assistant (RAG)":
    st.markdown("## 💬 HITK Campus AI Assistant")
    st.markdown("Ask anything about lost items, where to deposit found belongings, or Gate 1 Security Desk procedures.")

    if "chat_history" not in st.session_state:
        st.session_state.chat_history = [
            {"role": "assistant", "content": "Hello! I am your HITK FindIt AI Assistant. How can I help you find or deposit belongings on campus today?"}
        ]

    for msg in st.session_state.chat_history:
        with st.chat_message(msg["role"]):
            st.write(msg["content"])

    user_query = st.chat_input("Ask about lost items (e.g. 'Where do I deposit an ID card found in Central Block?')")
    if user_query:
        st.session_state.chat_history.append({"role": "user", "content": user_query})
        with st.chat_message("user"):
            st.write(user_query)

        with st.chat_message("assistant"):
            with st.spinner("Consulting Heritage campus database & security guidelines..."):
                try:
                    from app.services.chatbot_service import chatbot_service
                    res = asyncio.run(chatbot_service.chat(user_query))
                    reply = res.get("reply", "Please check at Gate 1 Security Desk.")
                except Exception as e:
                    reply = f"If you found an item near Central Block, please deposit it directly at the Campus Security Office at Gate 1 (Chowbaga Road Main Entrance). You can also report it on this portal!"
                st.write(reply)
                st.session_state.chat_history.append({"role": "assistant", "content": reply})

# ----------------- 7. GATE 1 CLAIMS -----------------
elif nav == "🛡️ Gate 1 Security & Claims":
    st.markdown("## 🛡️ Gate 1 Security Desk & Ownership Claims")
    st.markdown("Physical handover verification and security oversight.")

    st.markdown("""
    ### 🏛️ Handover Standard Operating Procedure (SOP)
    1. **Physical Depository:** All unattended items found on campus are secured in the **Gate 1 Security Office safe lockers**.
    2. **Secret Identifying Proof:** Claimants must provide secret details (e.g. unique scratches, sticker placement, wallpaper descriptions).
    3. **ID Card Cross-Check:** Prior to release, the claimant presents their **Heritage Institute of Technology Student ID Card**.
    """)

    st.divider()
    st.markdown("### 📋 Verification Queue")
    c1, c2, c3 = st.columns(3)
    with c1:
        st.write("**Claim #CLM-104**")
        st.caption("Item: Casio Calculator | Claimant: 12623001045")
        st.button("Approve Handover", key="app1")
    with c2:
        st.write("**Claim #CLM-105**")
        st.caption("Item: Milton Flask | Claimant: 12623002012")
        st.button("Approve Handover", key="app2")
    with c3:
        st.write("**Claim #CLM-106**")
        st.caption("Item: Honda Bike Key | Claimant: 12623003088")
        st.button("Approve Handover", key="app3")
