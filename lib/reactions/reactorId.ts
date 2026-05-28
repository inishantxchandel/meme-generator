export function getReactorId(): string {
  if (typeof window === "undefined") return ""
  let id = localStorage.getItem("reactor_id")
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem("reactor_id", id)
  }
  return id
}
