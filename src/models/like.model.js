import mongoose, { Schema, model } from "mongoose";

const likeSchema = new Schema(
  {
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video",
        //  required: true
    },
    comment:{
        type: Schema.Types.ObjectId,
        ref: "Comment",
        // required:true
    },
    tweet:{
        type: Schema.Types.ObjectId,
        ref: "Tweet",
        // required:true
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      // required:true
    },
  },
  { timestamps: true }
);

export const Like = model("Like", likeSchema);
