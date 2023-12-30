const asyncHander=(requestHandler)=>{
  return  (req,res,next)=>{
        Promise
        .resolve(requestHandler(req,res,next))
        .catch((error)=>{
         next(error)
        })
    }
}

export {asyncHander}
/*
// const asyncHander=(fun)=>async (req,res,next)=>{
//     try{
//      await fun(req,res,next)
//     }catch(error){
// res. status(error.code || 500).json({
//     success:false,
//     message:error.message
// })
//     }
// 
*/