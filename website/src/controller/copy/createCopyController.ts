import { Controller, ControllerType } from "../controller";
import { CopyController } from "./copyController";
import { FileSystemCopyController } from "./fileSystem";

export const getCopyController = (fromController: Controller, toController: Controller): CopyController|null =>
    fromController.type == ControllerType.FileSystem && toController.type == ControllerType.FileSystem
    ? new FileSystemCopyController(fromController, toController)
    : fromController.type == ControllerType.Remote && toController.type == ControllerType.FileSystem
    ? new CopyController(fromController, toController)
    : fromController.type == ControllerType.FileSystem && toController.type == ControllerType.Remote
    ? new CopyController(fromController, toController)
    : null
