import streamlit as st
import requests

API_URL = "http://localhost:8000/api"

st.set_page_config(page_title="TILAWA App", page_icon="🕋", layout="wide")

st.title("🕋 TILAWA - Quran & Tajweed")
st.sidebar.header("Navigation")
page = st.sidebar.radio("Go to", ["Dashboard", "Surahs", "Tajweed Rules", "Quiz"])

st.sidebar.markdown("---")
st.sidebar.info("Make sure the FastAPI backend is running! (`python server.py` or `uvicorn server:app`)")

def get_data(endpoint):
    try:
        response = requests.get(f"{API_URL}/{endpoint}")
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        st.error(f"Failed to connect to backend: {e}")
        return None

if page == "Dashboard":
    st.header("📊 Dashboard")
    data = get_data("dashboard/stats")
    if data:
        col1, col2, col3 = st.columns(3)
        col1.metric("Total Sessions", data.get("total_sessions", 0))
        col2.metric("Average Score", data.get("average_score", 0))
        col3.metric("Streak Days", data.get("streak_days", 0))
        st.write("Level:", data.get("level", 1))
        st.write("XP:", data.get("xp_total", 0))

elif page == "Surahs":
    st.header("📖 Surahs")
    data = get_data("surahs")
    if data and "surahs" in data:
        surah_names = {s["id"]: f"{s['id']}. {s['name_simple']} ({s.get('name_arabic', '')})" for s in data["surahs"]}
        selected_id = st.selectbox("Select a Surah", options=list(surah_names.keys()), format_func=lambda x: surah_names[x])
        
        if selected_id:
            verses_data = get_data(f"surahs/{selected_id}/verses")
            if verses_data and "verses" in verses_data:
                for verse in verses_data["verses"]:
                    st.markdown(f"**{verse['verse_key']}**")
                    st.write(f"<h3 style='text-align: right; font-family: sans-serif;' dir='rtl'>{verse['text_uthmani']}</h3>", unsafe_allow_html=True)
                    translation = verse.get('translations', [{}])[0].get('text', '') if verse.get('translations') else ''
                    st.write(f"*{translation}*")
                    st.markdown("---")

elif page == "Tajweed Rules":
    st.header("🔍 Tajweed Rules")
    data = get_data("tajweed/rules")
    if data and "rules" in data:
        for rule in data["rules"]:
            with st.expander(f"{rule['name']} - {rule['name_arabic']}"):
                st.write("**Description:**", rule['description'])
                st.write("**Overview:**", rule['overview'])
                st.write("**Example:**", rule['example'], f"({rule.get('example_ref', '')})")
                st.info(f"**Tip:** {rule.get('practice_tip', '')}")

elif page == "Quiz":
    st.header("📝 Tajweed Quiz")
    data = get_data("quiz/questions")
    if data and "questions" in data:
        with st.form("quiz_form"):
            answers = {}
            for q in data["questions"]:
                st.subheader(q["question"])
                st.markdown(f"> {q['verse_snippet']} ({q.get('verse_ref', '')})")
                options = [opt["text"] for opt in q["options"]]
                option_ids = {opt["text"]: opt["id"] for opt in q["options"]}
                selected = st.radio(f"Select answer", options, key=q["id"])
                answers[str(q["id"])] = option_ids[selected]
            
            submit = st.form_submit_button("Submit Quiz")
            if submit:
                try:
                    res = requests.post(f"{API_URL}/quiz/submit", json={"answers": answers})
                    if res.status_code == 200:
                        result_data = res.json()
                        st.success(f"You scored {result_data['percentage']}% ({result_data['score']}/{result_data['total']})! XP Earned: {result_data['xp_earned']}")
                        for r in result_data["results"]:
                            st.write(f"**Question {r['question_id']}:** {'✅ Correct' if r['is_correct'] else '❌ Incorrect'}")
                            st.write(f"Explanation: {r.get('explanation', '')}")
                            st.markdown("---")
                except Exception as e:
                    st.error(f"Error submitting quiz: {e}")
