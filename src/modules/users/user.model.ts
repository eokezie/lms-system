import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export const USER_ROLES = ["student", "instructor", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface IUser extends Document {
	_id: mongoose.Types.ObjectId;
	firstName: string;
	lastName: string;
	email: string;
	passwordHash: string;
	role: UserRole;
	avatar?: string;
	bio?: string;
	isEmailVerified: boolean;
	refreshTokens: Array<{ token: string; createdAt: Date }>;
	createdAt: Date;
	updatedAt: Date;
	// Instance methods
	comparePassword(password: string): Promise<boolean>;
	fullName(): string;
}

const userSchema = new Schema<IUser>(
	{
		firstName: { type: String, required: true, trim: true, maxlength: 50 },
		lastName: { type: String, required: true, trim: true, maxlength: 50 },
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			index: true,
		},
		passwordHash: { type: String, required: true, select: false }, // never returned by default
		role: {
			type: String,
			enum: ["student", "instructor", "admin"],
			default: "student",
		},
		avatar: { type: String },
		bio: { type: String, maxlength: 500 },
		isEmailVerified: { type: Boolean, default: false },
		refreshTokens: [
			{
				token: { type: String, required: true },
				createdAt: { type: Date, default: Date.now },
			},
		],
	},
	{
		timestamps: true,
		toJSON: {
			transform(_doc, ret: Partial<IUser> & { __v?: number }) {
				delete ret.passwordHash;
				delete ret.refreshTokens;
				delete ret.__v;
				return ret;
			},
		},
	},
);

// Hash password before saving if it was modified
userSchema.pre("save", async function (next) {
	if (!this.isModified("passwordHash")) return next();
	this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
	next();
});

userSchema.methods.comparePassword = async function (
	password: string,
): Promise<boolean> {
	return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.fullName = function (): string {
	return `${this.firstName} ${this.lastName}`;
};

// Clean up old refresh tokens (keep last 5)
userSchema.methods.pruneRefreshTokens = function () {
	if (this.refreshTokens.length > 5) {
		this.refreshTokens = this.refreshTokens.slice(-5);
	}
};

export const User = mongoose.model<IUser>("User", userSchema);
