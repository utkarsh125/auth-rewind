import { RESEND_API_KEY } from "../constants/env";
import { Resend } from "resend";

const resend = new Resend(RESEND_API_KEY);

export default resend; 
//now create a utility function inside `/utils`