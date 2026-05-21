import { getServerSession } from "./get-session"

export const getUserId = async() => {
    const session = await getServerSession();
    const user = session?.user;

    return user?.id || null;
}