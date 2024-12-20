import mongoose, { Model, Schema } from "mongoose";
import bcrypt from "bcrypt";
import IUser from "../types/IUser";
import EnumErrorNames from "../types/EnumErrorNames";
import IRecipe from "../types/IRecipe";
import { getUserIdFromToken } from "../helpers/getUserFromToken";
import { Request } from "express";
import { UploadedFile } from "express-fileupload";
import deleteFileFromCloudinary from "../helpers/deleteFileFromCloudinary";
import EnumCloudinaryFileTypes from "../types/EnumCloudinaryFileTypes";
import uploadFilesToCloudinary from "../helpers/uploadFilesToCloudinary";
interface IUserModel extends Model<IUser> {
    register: (name: IUser["name"], email: IUser["email"], password: IUser["password"], role: IUser["role"]) => Promise<IUser>;
    login: (email: IUser["email"], password: IUser["password"]) => Promise<IUser>;
    addFollowings: (followed : IUser['_id'], follower : IUser['_id']) => Promise<void>;
    removeFollowings: (followed : IUser['_id'], follower : IUser['_id']) => Promise<void>;
    addSaves : (recipe : IRecipe['_id'], user : IUser['_id']) => Promise<void>;
    removeSaves : (recipe : IRecipe['_id'], user : IUser['_id']) => Promise<void>;
    update: (req : Request) => Promise<IUser>;
}

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: false,
        },
        avatar: {
            type: String,
            required: false,
        },
        role: {
            type: Boolean,
            default: false,
        },
        recipes: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Recipe",
            required: false,
        },
        comments: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Comment",
            required: false,
        },

        followers: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "User",
            required: false,
        },
        followings: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "User",
            required: false,
        },
        saves : {
            type : [mongoose.Schema.Types.ObjectId],
            ref : "Recipe",
            required : false
        }
    },
    {
        timestamps: true,
    }
);

UserSchema.statics.register = async function (name: IUser["name"], email: IUser["email"], password: IUser["password"], role: IUser["role"]): Promise<IUser> {
    const userExists = await this.findOne({ email: email });
    if (userExists) {
        const error = new Error("User already exists");
        error.name = EnumErrorNames.RegisterUserExists;
        throw error;
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    const user: IUser = new this({
        name: name,
        email: email,
        password: hashedPassword,
        role: role,
    });
    await user.save();
    return user;
};

UserSchema.statics.login = async function (email: IUser["email"], password: IUser["password"]): Promise<IUser> {
    try {
        console.log('email', email);
        const user: IUser = await this.findOne({ email: email });
        console.log('user', user)
        if (!user) {
            const error = new Error("user does not exists");
            error.name = EnumErrorNames.LoginUserDoesNotExist;
            throw error;
        }
        if (await bcrypt.compare(password, user.password)) {
            return user;
        } else {
            const error = new Error("incorrect password");
            error.name = EnumErrorNames.LoginIncorrectPassword;
            throw error;
        }
    } catch (e) {
        console.log(e);
        throw new Error((e as Error).message);
    }
};


UserSchema.statics.addFollowings = async function (followed : IUser['_id'], follower : IUser['_id']) {
    try {
        // add to the array of followers of the followed user
        await User.updateOne({ _id: followed }, { $push: { followers: follower } });

        // add to the array of followings of the follower user
        await User.updateOne({ _id: follower }, { $push: { followings: followed } });


    } catch (e) {
        console.log(e);
        throw new Error((e as Error).message);
    }
}

UserSchema.statics.removeFollowings = async function (followed : IUser['_id'], follower : IUser['_id']) {
    try {
        // remove from the array of followers of the followed user
        await User.updateOne({ _id: followed }, { $pull: { followers: follower } });

        // remove from the array of followings of the follower user
        await User.updateOne({ _id: follower }, { $pull: { followings: followed } });
    } catch (e) {
        console.log(e);
        throw new Error((e as Error).message);
    }
}

UserSchema.statics.addSaves = async function (recipe : IRecipe['_id'], user : IUser['_id']) {
    try {
        await User.updateOne({ _id : user}, { $push : { saves : recipe } });
    } catch (e) {
        console.log(e);
        throw new Error((e as Error).message);
    }
}

UserSchema.statics.removeSaves = async function (recipe : IRecipe['_id'], user : IUser['_id']) {
    try {
        await User.updateOne({ _id : user}, { $pull : { saves : recipe } });
    } catch (e) {
        console.log(e);
        throw new Error((e as Error).message);
    }
}

UserSchema.statics.update = async function (req : Request) : Promise<IUser> {
    try {
        // get old user info
        const userId : Schema.Types.ObjectId = await getUserIdFromToken(req);
        if(!userId) throw new Error("not authenticated");
        const user = await User.findById(userId);
        if(!user) throw new Error("user not found");

        // check old password
        const isMatch = req.body.oldPassword ? await bcrypt.compare(req.body.oldPassword, user.password) : true;
        if(!isMatch) throw new Error("incorrect password");

        // update new password
        if(req.body.newPassword)  user.password = getHashedPassword(req.body.newPassword);

        // handle avatar change
        if(req.files?.avatar) {
            if(user.avatar) await deleteFileFromCloudinary(user.avatar, EnumCloudinaryFileTypes.image);
            const image = req.files.avatar as UploadedFile;
            const imageUrl = await uploadFilesToCloudinary(image, EnumCloudinaryFileTypes.image);
            if(!imageUrl) throw new Error("Error uploading files to Cloudinary");
            user.avatar = imageUrl;
        }

        // handle name change
        user.name = req.body.name;
        await user.save();
        return user;

    } catch (e) {
        console.log(e);
        throw new Error((e as Error).message);
    }
}

function getHashedPassword(password : string) {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
}


const User: IUserModel = mongoose.model<IUser, IUserModel>("User", UserSchema);
export default User;
