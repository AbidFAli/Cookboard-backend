const commentsRouter = require("express").Router({ mergeParams: true });
const { request } = require("../app");
const { Comment } = require("../models/comment");
const { ID_ROUTE_REGEX } = require("../utils/controllers/routerHelper");

//TODO: likes, test buildSort and buildFilter
//test buildSort

/*
*@returns filter for a mongoose.Find() or {error: <string>}
if there is an error
*/
const buildFilter = (routeQueryParams, filter) => {
  //before >= after   [3,4]
  //before < after [1,2] U [4,5]
  //Ex: before = 2, after = 4

  let after = Number(routeQueryParams.after);
  let before = Number(routeQueryParams.before);

  if (
    (routeQueryParams.after !== undefined && Number.isNaN(after)) ||
    (routeQueryParams.before !== undefined && Number.isNaN(before))
  ) {
    return { error: "after/before must be a number" };
  }

  if (routeQueryParams.after) {
    filter.date = { $gt: new Date(after) };
  }

  if (routeQueryParams.before) {
    if (filter.date) {
      filter.date.$lt = new Date(before);
    } else {
      filter.date = { $lt: new Date(before) };
    }
  }
  return filter;
};

/*
 *@ returns sort object for mongoose.query.sort()  
  or {error: <string} in case of error
  *default is {date: -1}
  *default for likes is {likes: 1}
 */
const buildSort = (routeQueryParams) => {
  let sort = { date: -1 };
  if (queryParamEmpty(routeQueryParams)) {
    return sort;
  }
  let sortOn = routeQueryParams.sortOn;
  sortOn = sortOn.toLowerCase();
  let sortDir = routeQueryParams.sortDir;

  //if sortOn !== likes, then date
  //if sortOn == likes and sortDir not provided, 1
  //if sortOn == date and sortDir not provided, -1

  if (sortOn === "likes") {
    if (sortDir === "" || sortDir === undefined) {
      sortDir = 1;
    } else if (sortDir !== "1" && sortDir !== "-1") {
      return { error: "sortDir must be -1 or 1" };
    }

    sort = { likes: sortDir };
  } else {
    if (sortDir === "" || sortDir === undefined) {
      sortDir = -1;
    } else if (sortDir !== "1" && sortDir !== "-1") {
      return { error: "sortDir must be -1 or 1" };
    }
    sort = { date: sortDir };
  }
  return sort;
};

const queryParamEmpty = (routeQueryParams) => {
  return !routeQueryParams.sortOn || !routeQueryParams.sortDir;
};

/*
  GET /api/recipes/:recipeId/comments?sortOn=<option>&sortDir=<dir>
    sortOn = "likes" | "date"
    sortDir="1"|"-1"
    after=<number> - ms represent UTC unix date
    before=<number> - ms represent UTC unix date
*/
commentsRouter.get("/", async (request, response, next) => {
  let recipeId = request.params.recipeId;

  let filter = { recipe: recipeId };

  filter = buildFilter(request.query, filter);
  if (filter.error) {
    return response.status(400).send(filter.error).send();
  }
  let sort = buildSort(request.query);
  if (sort.error) {
    return response.status(400).send(sort.error).send();
  }
  let comments;

  try {
    let query = Comment.find(filter).sort(sort);
    comments = await query;
  } catch (error) {
    next(error);
  }

  return response.send(comments);
});

commentsRouter.get(
  `/:commentId(${ID_ROUTE_REGEX})`,
  async (request, response, next) => {
    let commentId = request.params.commentId;

    let comment = await Comment.findById(commentId);
    if (!comment) {
      return response.status(404).send();
    }
    return response.send(comment);
  }
);

// commentsRouter.get(
//   `/:commentId(${ID_ROUTE_REGEX})/replies`,
//   async (request, response, next) => {}
// );

/*
request body: {
  text: string
  parent: commentId,
  user: userId,
  date: number, UTC date. num ms since unix epoch.
}
*/
commentsRouter.post("", async (request, response, next) => {
  if (typeof request.body.date != "number") {
    return response.status(400).send("Comments must provide a date");
  }
  let date = new Date(request.body.date);

  let comment = new Comment({
    likes: 0,
    text: request.body.text,
    recipe: request.params.recipeId,
    user: request.user.id,
    date: date,
  });
  if (request.body.parent) {
    comment.parent = request.body.parent;
  }

  try {
    await comment.save();
    response.send(comment);
  } catch (error) {
    next(error);
  }
});

// commentsRouter.post(
//   `/:commentId(${ID_ROUTE_REGEX})/replies`,
//   async (request, response, next) => {
//     response.status(400).send("Not implemented").send();
//   }
// );

// commentsRouter.put(
//   `/:commentId(${ID_ROUTE_REGEX})`,
//   async (request, response, next) => {
//     response.status(400).send("Not implemented").send();
//   }
// );

// commentsRouter.delete("/:commentId(${ID_ROUTE_REGEX})", async (request, response, next) => {
//   response.status(400).send("Not implemented").send();
// });

module.exports = {
  commentsRouter,
};
