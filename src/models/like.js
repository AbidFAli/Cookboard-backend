const {Schema} = require("mongoose");



const likesSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    
  }
)