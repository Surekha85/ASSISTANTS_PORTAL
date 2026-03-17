// TODO: This endpoint is deprecated - user creation should be handled in /api/auth/signup
// Remove this file once the new auth system is implemented

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // This endpoint is no longer used with the new auth system
  return res.status(501).json({ 
    message: "This endpoint is deprecated. User creation should be handled in /api/auth/signup",
    todo: "Remove this file once new auth system is implemented"
  });
}