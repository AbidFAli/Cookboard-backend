

const usePathsExcept = (paths, middleware) => {
  return (request, response, next) => {
      if(paths.includes(request.baseUrl)){
          return next();
      } else {
          return middleware(request, response, next)
      }
  }
}

const useMethodsExcept = (methodsToIgnore, middleware) => {
  return (request, response, next) => {
    if(methodsToIgnore.includes(request.method)){
      return next();
    }
    else{
      return middleware(request, response, next)
    }
  }
}

module.exports = {
  usePathsExcept,
  useMethodsExcept
}