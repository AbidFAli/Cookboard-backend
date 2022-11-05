const similarNames = () => {
  const recipeList = [
    {
      name: "waffles",
      description: "crunchy",
    },
    {
      name: "french toast",
      description: "yummy",
    },
    {
      name: "pancakes",
      description: "syrupy",
    },
    {
      name: "cinnamon pancakes",
      description: "cinnamony",
    },
  ];

  return recipeList;
};

const namesAndRatings = () => {
  return [
    {
      name: "waffles",
      rating: 4,
    },
    {
      name: "blueberry waffles",
      rating: 3,
    },
    {
      name: "chocolate waffles",
      rating: 5,
    },
    {
      name: "pancakes",
      rating: 3.1,
    },
    { name: "scrambled eggs", rating: 2 },
  ];
};

const waffles = () => {
  let recipeParams = {
    name: "waffles",
    description: "yummy",
    instructions: ["heat pan", "add oil", "add batter", "cook", "flip"],
    ingredients: [
      { name: "batter", amount: 1, unit: "cup" },
      { name: "water", amount: 2, unit: "cup" },
    ],
    rating: 2.5,
    timeToMake: { value: 5, unit: "minutes" },
    servingInfo: { numServed: 1, yield: 1, servingSize: 1, unit: "pancake" },
    calories: 300,
  };
  return recipeParams;
};

module.exports = {
  similarNames,
  namesAndRatings,
  waffles,
};
