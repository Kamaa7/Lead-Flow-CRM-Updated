import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ViewColumnsIcon, PlusIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { fetchTasks, updateTask } from '../store/tasksSlice';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const ScrumBoard = () => {
  const dispatch = useDispatch();
  const { tasks, loading } = useSelector((state) => state.tasks);
  
  const columns = {
    pending: {
      id: 'pending',
      title: 'To Do',
      color: 'bg-gray-100',
      headerColor: 'bg-gray-500'
    },
    in_progress: {
      id: 'in_progress',
      title: 'In Progress',
      color: 'bg-blue-100',
      headerColor: 'bg-blue-500'
    },
    completed: {
      id: 'completed',
      title: 'Completed',
      color: 'bg-green-100',
      headerColor: 'bg-green-500'
    },
    cancelled: {
      id: 'cancelled',
      title: 'Cancelled',
      color: 'bg-red-100',
      headerColor: 'bg-red-500'
    }
  };

  useEffect(() => {
    dispatch(fetchTasks({}));
  }, [dispatch]);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    try {
      await dispatch(updateTask({
        id: task.id,
        data: { ...task, status: destination.droppableId }
      })).unwrap();
      
      toast.success(`Task moved to ${columns[destination.droppableId].title}`);
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const TaskCard = ({ task, index }) => (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={clsx(
            'bg-white p-4 rounded-lg shadow-sm border-l-4 mb-3 cursor-move',
            getPriorityColor(task.priority),
            snapshot.isDragging && 'shadow-lg transform rotate-2'
          )}
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
            <button className="text-gray-400 hover:text-gray-600">
              <EllipsisVerticalIcon className="h-4 w-4" />
            </button>
          </div>
          
          {task.description && (
            <p className="text-xs text-gray-600 mb-3 line-clamp-2">
              {task.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className={clsx(
                'px-2 py-1 rounded-full text-xs font-medium',
                task.priority === 'high' ? 'bg-red-100 text-red-800' :
                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              )}>
                {task.priority}
              </span>
            </div>
            
            {task.due_date && (
              <span className="text-gray-500">
                {formatDate(task.due_date)}
              </span>
            )}
          </div>
          
          {task.assigned_to && (
            <div className="mt-2 flex items-center">
              <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-medium">
                  {task.assigned_to.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="ml-2 text-xs text-gray-600">{task.assigned_to}</span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );

  const Column = ({ column, tasks }) => (
    <div className="flex-1 min-w-80">
      <div className={clsx('p-3 rounded-t-lg', column.headerColor)}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">{column.title}</h3>
          <div className="flex items-center space-x-2">
            <span className="bg-white bg-opacity-20 text-white text-xs px-2 py-1 rounded-full">
              {tasks.length}
            </span>
            <button className="text-white hover:text-gray-200">
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={clsx(
              'min-h-96 p-3 rounded-b-lg',
              column.color,
              snapshot.isDraggingOver && 'bg-opacity-50'
            )}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
            
            {tasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <ViewColumnsIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tasks</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scrum Board</h1>
          <p className="text-gray-600">Visual deal tracking and pipeline management</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex space-x-0 overflow-x-auto min-h-screen">
            {Object.values(columns).map(column => (
              <Column
                key={column.id}
                column={column}
                tasks={getTasksByStatus(column.id)}
              />
            ))}
          </div>
        </DragDropContext>
      </div>
      
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <p>Updating task...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScrumBoard;