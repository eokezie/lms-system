import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/apiResponse";
import {
  getCourseSettingsService,
  patchCourseSettingsService,
  getInstructorProfileDefaultsService,
  patchInstructorProfileDefaultsService,
  listStaffUsersService,
  inviteUserService,
  updateStaffUserStatusService,
  removeStaffUserService,
  getPermissionsForUserService,
  listRolesService,
  getRolePermissionsService,
  updateRolePermissionsService,
  createRoleService,
  deleteRoleService,
} from "./admin-settings.service";

export const getCourseSettingsHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const data = await getCourseSettingsService();
    sendSuccess({ res, message: "Course settings loaded", data });
  },
);

export const patchCourseSettingsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const data = await patchCourseSettingsService(req.body);
    sendSuccess({ res, message: "Course settings updated", data });
  },
);

export const getInstructorDefaultsHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const data = await getInstructorProfileDefaultsService();
    sendSuccess({ res, message: "Instructor profile defaults loaded", data });
  },
);

export const patchInstructorDefaultsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const data = await patchInstructorProfileDefaultsService(req.body);
    sendSuccess({ res, message: "Instructor profile defaults updated", data });
  },
);

export const listStaffUsersHandler = catchAsync(
  async (req: Request, res: Response) => {
    const q = req.query as unknown as {
      page: number;
      limit: number;
      role?: string;
      search?: string;
    };
    const result = await listStaffUsersService(
      {
        page: q.page ?? 1,
        limit: q.limit ?? 20,
        role: q.role,
        search: q.search,
      },
      req.user!.role as any,
    );
    sendSuccess({
      res,
      message: "Users loaded",
      data: result.users,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  },
);

export const inviteStaffUserHandler = catchAsync(
  async (req: Request, res: Response) => {
    const data = await inviteUserService(req.body, req.user!.userId, req.user!.role as any);
    sendCreated({
      res,
      message: "User invited",
      data,
    });
  },
);

export const getStaffUserPermissionsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const data = await getPermissionsForUserService(id, req.user!.role as any);
    sendSuccess({ res, message: "Permissions loaded", data });
  },
);

export const patchStaffUserStatusHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: "active" | "suspended" };
    const user = await updateStaffUserStatusService(
      id,
      status,
      req.user!.userId,
      req.user!.role as any,
    );
    sendSuccess({ res, message: "User updated", data: { user } });
  },
);

export const deleteStaffUserHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const data = await removeStaffUserService(id, req.user!.userId, req.user!.role as any);
    sendSuccess({ res, message: "User removed", data });
  },
);

export const listRolesHandler = catchAsync(async (req: Request, res: Response) => {
  const data = await listRolesService(req.user!.role as any);
  sendSuccess({ res, message: "Roles loaded", data });
});

export const getRolePermissionsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const data = await getRolePermissionsService(id, req.user!.role as any);
    sendSuccess({ res, message: "Role permissions loaded", data });
  },
);

export const patchRolePermissionsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const data = await updateRolePermissionsService(
      id,
      req.body.permissions,
      req.user!.role as any,
    );
    sendSuccess({ res, message: "Role permissions updated", data });
  },
);

export const createRoleHandler = catchAsync(async (req: Request, res: Response) => {
  const data = await createRoleService(req.body, req.user!.role as any);
  sendCreated({ res, message: "Role created", data });
});

export const deleteRoleHandler = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const data = await deleteRoleService(id, req.user!.role as any);
  sendSuccess({ res, message: "Role deleted", data });
});
