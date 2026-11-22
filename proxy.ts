import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./app/lib/auth";

export async function proxy(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(), 
    });
    const user = session?.user;
    // console.log(user); user dekhte parbo j ke login ache
    if(!user){
        return NextResponse.redirect('/login',request.url)
    } 
}

export const config = {
    // j j page secure korte chai
    matcher: ['/app/components/info-page.module.css'],
};
