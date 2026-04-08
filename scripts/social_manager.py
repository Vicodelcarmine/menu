import json
import os
from datetime import datetime, timedelta

PLAN_FILE = "/home/ubuntu/.openclaw/workspace/projects/vico-del-carmine/social_plan.json"

DEFAULT_THEMES = [
    {"day": "Lunedì", "theme": "La Regina: Pizza Margherita Napoletana", "dish": "Pizza Margherita", "type": "Pizza"},
    {"day": "Martedì", "theme": "Sapore di Mare: Paccheri alla Genovese di Mare", "dish": "Paccheri alla Genovese", "type": "Primo"},
    {"day": "Mercoledì", "theme": "Tradizione Toscana: Tagliata di Scottona", "dish": "Tagliata di Scottona", "type": "Secondo"},
    {"day": "Giovedì", "theme": "L'Anima di Napoli: Salsiccia e Friarielli", "dish": "Pizza Salsiccia e Friarielli", "type": "Pizza"},
    {"day": "Venerdì", "theme": "Il Mare in Griglia: Spigola ai Ferri", "dish": "Spigola alla griglia", "type": "Pesce"},
    {"day": "Sabato", "theme": "Weekend in San Frediano: Atmosfera Vico", "dish": "Atmosfera Locale", "type": "Atmosfera"},
    {"day": "Domenica", "theme": "Dolce Chiusura: Il nostro Babà al Rum", "dish": "Babà Napoletano", "type": "Dolce"}
]

def get_or_create_plan():
    if os.path.exists(PLAN_FILE):
        with open(PLAN_FILE, "r") as f:
            return json.load(f)
    return DEFAULT_THEMES

def generate_weekly_report():
    plan = get_or_create_plan()
    report = "📅 **PROGRAMMA SOCIAL SETTIMANALE - VICO DEL CARMINE** ⚡️\n\n"
    for item in plan:
        report += f"• **{item['day']}**: {item['theme']}\n"
    report += "\nOgni sera alle 19:00 ti manderò il testo del giorno dopo per la tua approvazione e la foto! 📸"
    return report

def get_tomorrow_draft():
    plan = get_or_create_plan()
    # Get tomorrow's day name in Italian
    days = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"]
    tomorrow_idx = (datetime.now().weekday() + 1) % 7
    tomorrow_day = days[tomorrow_idx]
    
    item = next((i for i in plan if i['day'] == tomorrow_day), plan[0])
    
    captions = {
        "Pizza": f"🍕 **{item['theme']}**\n\nLievitazione 72 ore, ingredienti freschissimi e il cuore di Napoli. La nostra pizza è ricca e digeribile, proprio come piace a voi.\n\n📍 Via Pisana 40/r, Firenze\n🕖 19:00 - 23:30\n\n#vicodelcarmine #pizzanapoletana #sanfrediano #firenze #tradizione",
        "Primo": f"🍝 **{item['theme']}**\n\nLa pasta fresca fatta in casa incontra i sapori del Mediterraneo. Un primo piatto che racconta la nostra passione.\n\n📍 Via Pisana 40/r, Firenze\n#vicodelcarmine #pastafresca #cucinaitaliana #firenzefood",
        "Secondo": f"🥩 **{item['theme']}**\n\nQualità della materia prima e cottura perfetta. Per chi ama la vera tradizione toscana e mediterranea.\n\n📍 Via Pisana 40/r, Firenze\n#tagliata #scottona #vico #sanfrediano #carne",
        "Pesce": f"🐟 **{item['theme']}**\n\nIl pesce più fresco del giorno, grigliato con amore. Leggerezza e gusto in ogni boccone.\n\n📍 Via Pisana 40/r, Firenze\n#pescefresco #grigliata #vico #mediterraneo",
        "Atmosfera": f"🍷 **{item['theme']}**\n\nNel cuore pulsante di San Frediano, tra un brindisi e una risata. La serata perfetta inizia da Vico.\n\n📍 Via Pisana 40/r, Firenze\n#sanfrediano #firenzenotte #vico #atmosfera",
        "Dolce": f"🍰 **{item['theme']}**\n\nNon c'è modo migliore di finire la cena. I nostri dolci sono fatti a mano ogni giorno.\n\n📍 Via Pisana 40/r, Firenze\n#babà #dolcinapoletani #vico #tentalafortuna"
    }
    
    caption = captions.get(item['type'], captions["Pizza"])
    return f"⚡️ **PROPOSTA POST PER DOMANI (Ore 12:30)**\n\n**Tema**: {item['theme']}\n\n**Testo suggerito**:\n{caption}\n\n--- \n📸 **Mandami la foto** per questo post e domani lo pubblicherò!"

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        if sys.argv[1] == "report":
            print(generate_weekly_report())
        elif sys.argv[1] == "draft":
            print(get_tomorrow_draft())
