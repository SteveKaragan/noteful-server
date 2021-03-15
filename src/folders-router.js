const express = require('express')
const xss = require('xss')
const FoldersService = require('./folders-service')
const foldersRouter = express.Router()
const jsonParser = express.json()

const serializeFolder = folder => ({
  folder_id: folder.folder_id,
  name: xss(folder.name),
})

foldersRouter
  .route('/')
  .get((req, res, next) => {
    FoldersService.getAllFolders(
      req.app.get('db')
    )
      .then(folders => {
        res.json(folders)
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { name } = req.body
    const newfolder = { name }
    for (const [key, value] of Object.entries(newfolder)) {
        if (value == null)
        return res.status(400).json({
            error: { message: `Missing '${key}' in request body`}
        })
    }
  
    FoldersService.insertFolder(
      req.app.get('db'),
      newfolder
    )
      .then(folder => {
        res
          .status(201)
          .location(`/folders/${folder.id}`)
          //.location(req.originalURL  `/${folder.id}`)
          .json(folder)
      })
      .catch(next)
  })

foldersRouter
  .route('/:folder_id')
     .all((req, res, next) => {
         FoldersService.getById(
           req.app.get('db'),
           req.params.folder_id
         )
           .then(folder => {
             if (!folder) {
               return res.status(404).json({
                 error: { message: `folder doesn't exist` }
               })
             }
             res.folder = folder // save the folder for the next middleware
             next() // don't forget to call next so the next middleware happens!
           })
           .catch(next)
       })
  .get((req, res, next) => {
    res.json({
      folder_id: res.folder.folder_id,
      name: xss(res.folder.name),
        })
    })
    .delete((req, res, next) => {
        FoldersService.deleteFolder(
            req.app.get('db'),
            req.params.folder_id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
      const { name } = req.body
      const folderToUpdate = { name }
      const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length
      if (numberOfValues === 0) {
        return res.status(400).json({
          error: {
            message: `Request body must contain name`
       }
     })
   }
      FoldersService.updateFolder(
        req.app.get('db'),
        req.params.folder_id,
        folderToUpdate
      )
        .then(numRowsAffected => {
          res.status(204).end()
        })
        .catch(next)
    })

module.exports = foldersRouter