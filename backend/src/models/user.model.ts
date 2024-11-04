import { compareValue, hashValue } from "../utils/bcrypt";

import bcrypt from "bcrypt";
import mongoose from "mongoose";

export interface UserDocument extends mongoose.Document {
    email: string;
    password: string;
    verified: boolean;
    createdAt: Date;
    updatedAt: Date;
    __v?: number;  // Add __v as an optional property
    comparePassword(val: string): Promise<boolean>;
    omitPassword(): Pick<UserDocument, "_id" | "email" | "createdAt" | "updatedAt" | "__v">;
  }
  

const userSchema = new mongoose.Schema<UserDocument>(
    {
        email: { type: String, unique: true, required: true },
        password: { type: String, required: true },
        verified: { type: Boolean, required: true, default: false },
    },
    {
        timestamps: true,
    }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
      return next();
    }
  
    this.password = await hashValue(this.password);
    return next();
});

userSchema.methods.comparePassword = async function (val: string){
    return compareValue(val, this.password);
}

userSchema.methods.omitPassword = function(){
    const user = this.toObject();
    delete user.password;
    return user;
}

const UserModel = mongoose.model<UserDocument>("User", userSchema);
export default UserModel;
