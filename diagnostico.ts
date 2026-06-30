// diagnostico.ts
// Ejecuta esto con: npx ts-node diagnostico.ts

const API_KEY = process.env.GEMINI_API_KEY;

async function verificarModelos() {
    if (!API_KEY) {
        console.error("¡ERROR! No has configurado la GEMINI_API_KEY en tu entorno.");
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        console.log("Consultando a Google...");
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("\n--- MODELOS DISPONIBLES EN TU CUENTA ---");
            data.models.forEach((m: any) => console.log(m.name));
            console.log("------------------------------------------\n");
        } else {
            console.log("Error en la respuesta:", data);
        }
    } catch (e) {
        console.error("Fallo la conexión:", e);
    }
}

verificarModelos();