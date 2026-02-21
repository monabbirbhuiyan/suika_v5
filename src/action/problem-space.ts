"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "./get-session";


export const getProblemSpaces = async () => {
    const session = await getServerSession();
    const user = session?.user;

    if (!user) {
        return null;
    }

    const problemSpaces = await prisma.user.findMany({
        where: { id: user.id },
        include: {
            problemSpaces: true,
        }
    })

    return {problemSpaces: problemSpaces[0]?.problemSpaces || []};
    
}