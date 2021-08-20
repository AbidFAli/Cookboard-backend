const similarNames = () => {
  const recipeList = [
    {
        name: "waffles",
        description : "crunchy"
    },
    {
        name : "french toast",
        description: "yummy"
    },
    {
        name: "pancakes",
        description: "syrupy"
    },
    {
        name: "cinnamon pancakes",
        description: "cinnamony"
    }
  ]

  return recipeList
}

const namesAndRatings = () => {
  return [
    {
      name: "waffles",
      rating: 4
    },
    {
      name: "blueberry waffles",
      rating: 3
    },
    {
      name: "chocolate waffles",
      rating: 5
    },
    {
      name: "pancakes",
      rating: 3.1
    },
    { name: "scrambled eggs",
      rating: 2
    }
  ]
}

module.exports = {
  similarNames,
  namesAndRatings
}

