import crypto from 'crypto';

async function run() {
  // Try to register
  const regRes = await fetch("http://127.0.0.1:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "testabc", password: "password123" })
  });
  console.log("Reg:", regRes.status, await regRes.text());

  // Try to log in
  const logRes = await fetch("http://127.0.0.1:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "testabc", password: "password123" })
  });
  const rawLog = await logRes.text();
  console.log("Log:", logRes.status, rawLog);
  const cookie = logRes.headers.get("set-cookie") || "";

  // Try to add a note
  const noteRes = await fetch("http://127.0.0.1:3000/api/data/notes", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "cookie": cookie
    },
    body: JSON.stringify({ title: "My Title", content: "My Content" })
  });
  console.log("Note added:", noteRes.status, await noteRes.text());

  // Get notes
  const getRes = await fetch("http://127.0.0.1:3000/api/data/notes", {
    method: "GET",
    headers: { "cookie": cookie }
  });
  console.log("Notes retrieved:", getRes.status, await getRes.text());
}
run();