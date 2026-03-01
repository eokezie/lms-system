import mongoose, { Document, Schema } from "mongoose";

export interface ICategory extends Document {
	_id: mongoose.Types.ObjectId;
	label: string;
	createdAt: Date;
	updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
	{
		label: { type: String, required: true, trim: true, maxlength: 200 },
	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true,
			transform(_doc, ret: Record<string, any>) {
				delete ret.__v;
				return ret;
			},
		},
	},
);

export const Category = mongoose.model<ICategory>("Category", categorySchema);
