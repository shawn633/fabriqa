// src/features/users/components/UsersActionDialog.tsx
'use client';

import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User } from '../data/schema';
import { JsonForm } from '@/components/form/json-form'; // 引入通用表单组件
import {
  getUserFormSchema, // 获取 schema 的函数
  getUserFormConfig, // 获取 config 的函数
  userFormComponentMap, // 组件映射
  UserFormData, // 表单数据类型
} from './user-form.config'; // 引入用户表单特定配置

interface Props {
  currentRow?: User; // 保持 User 类型，或者使用后端返回的更精确类型
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // 可能还需要一个 onSubmit 回调，将数据发送到 API
  onFormSubmit?: (data: UserFormData, isEdit: boolean) => Promise<void>;
}

export function UsersActionDialog({ currentRow, open, onOpenChange, onFormSubmit }: Props) {
  const isEdit = !!currentRow;

  // 根据是否编辑动态获取 Schema 和 Config
  const formSchema = getUserFormSchema(isEdit);
  const formConfig = getUserFormConfig(isEdit);

  // 准备默认值
  // 注意：只传递 schema 中定义的字段
  const defaultValues: Partial<UserFormData> = isEdit
    ? {
        firstName: currentRow.firstName,
        lastName: currentRow.lastName,
        username: currentRow.username,
        email: currentRow.email,
        phoneNumber: currentRow.phoneNumber,
        role: currentRow.role,
        // 密码字段留空，表示不修改
        password: '',
        confirmPassword: '',
      }
    : {
        // 提供新建时的默认空值或预设值
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phoneNumber: '',
        role: '',
        password: '',
        confirmPassword: '',
      };

  const handleSubmit = async (values: UserFormData) => {
    try {
      // 调用外部传入的提交逻辑
      await onFormSubmit?.(values, isEdit);

      toast({
        title: `User ${isEdit ? 'updated' : 'added'} successfully!`,
        // description: ( ... optional ... )
      });
      onOpenChange(false); // 关闭对话框
      // 注意：表单的 reset 通常由 JsonForm 内部的 useForm 或通过 key 变化触发
      // 如果需要在提交成功后显式重置，可能需要 JsonForm 提供一个重置方法或依赖 key
    } catch (error) {
      console.error('Submission failed:', error);
      toast({
        title: 'Error',
        description: `Failed to ${isEdit ? 'update' : 'add'} user. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  // Dialog 的 onOpenChange 现在只负责关闭，重置由 useForm 或 key 管理
  const handleDialogChange = (state: boolean) => {
      onOpenChange(state);
      // 如果 state 为 false (关闭)，可以考虑是否需要手动触发清理逻辑 (如果 RHF 未自动处理)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-left'>
          <DialogTitle>{isEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the user information.' : 'Create a new user.'}
          </DialogDescription>
        </DialogHeader>
        {/*
           给 JsonForm 添加 key={currentRow?.id || 'new'}
           可以确保在切换编辑/新增或编辑不同用户时，RHF 实例被重新创建，
           从而正确应用 defaultValues 并重置表单状态。
           这是控制 RHF 重置的一种常用且有效的方式。
        */}
        <ScrollArea className='-mr-4 max-h-[60vh] w-full py-1 pr-4'> {/* 使用 max-h 替代固定高度 */}
          <JsonForm
            key={currentRow?.id || 'new'} // <--- 重要：用于重置表单
            schema={formSchema}
            config={formConfig}
            componentMap={userFormComponentMap}
            onSubmit={handleSubmit}
            defaultValues={defaultValues}
            formId="user-action-form" // 给表单一个 ID
            layoutProps={{ formClassName: 'space-y-4 px-0.5', fieldItemClassName: ' items-center gap-x-4 gap-y-1 space-y-0', fieldContainerClassName: 'col-span-4 col-start-3' }} // 自定义表单内部样式
            // submitButtonText={isEdit ? 'Save Changes' : 'Create User'} // 不再需要，按钮放在 Footer
          />
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
             type='submit' // 触发表单提交
             form='user-action-form' // 关联到 JsonForm 内部的 form
             // disabled={/* 可以从 JsonForm 内部获取 isSubmitting 状态，但这较复杂 */}
             // 简单的做法是依赖 RHF 的内置处理，或在 handleSubmit 开始时设置加载状态
          >
            {isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}