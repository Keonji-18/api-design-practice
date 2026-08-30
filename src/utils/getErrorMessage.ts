export default function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message
    } else if (error && typeof error === "object" && "message" in error) {
        return String(error.message)
    } else if (typeof error === "string") {
        return error
    }
    return "An error occurred"
}