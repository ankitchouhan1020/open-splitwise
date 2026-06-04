const port = process.env.PORT || 3000;
const res = await fetch(`http://127.0.0.1:${port}/api/auth/splitwise`, {
  redirect: "manual",
  headers: {
    "X-Forwarded-Proto": "https",
    "X-Forwarded-Host": "wrong.up.railway.app",
  },
});
console.log("status", res.status);
const location = res.headers.get("location") ?? "";
console.log("location", location);
if (location) {
  const url = new URL(location);
  console.log("redirect_uri", url.searchParams.get("redirect_uri"));
}
console.log("env_SPLITWISE_REDIRECT_URI", process.env.SPLITWISE_REDIRECT_URI);
