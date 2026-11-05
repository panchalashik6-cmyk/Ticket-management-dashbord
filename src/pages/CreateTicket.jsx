import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Send } from 'lucide-react';
import { useTicketContext } from '../context/TicketContext';
import '../styles/CreateTicket.css';

// Zod Validation Schema matching all assignment requirements
const createTicketSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, 'Customer name is required.')
    .min(3, 'Customer name must be at least 3 characters.'),
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required.')
    .email('Please enter a valid email address.'),
  subject: z
    .string()
    .trim()
    .min(1, 'Subject is required.')
    .min(5, 'Subject must be at least 5 characters.')
    .max(100, 'Subject cannot exceed 100 characters.'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required.')
    .min(10, 'Description must be at least 10 characters.'),
  category: z.enum(['Technical', 'Billing', 'General'], {
    errorMap: () => ({ message: 'Please select a valid category.' })
  }),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent'], {
    errorMap: () => ({ message: 'Please select a priority level.' })
  }),
  assignedAgent: z.string().optional(),
  dueDate: z
    .string()
    .min(1, 'Due date is required.')
    .refine(
      (dateStr) => {
        const selected = new Date(dateStr);
        if (isNaN(selected.getTime())) return false;
        selected.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return selected >= today;
      },
      { message: 'Due date cannot be in the past.' }
    )
});

function CreateTicket() {
  const { agents, addNewTicket, addToast } = useTicketContext();
  const navigate = useNavigate();

  const [isRedirecting, setIsRedirecting] = useState(false);

  const todayIso = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      customerName: '',
      email: '',
      subject: '',
      description: '',
      category: 'Technical',
      priority: 'Medium',
      assignedAgent: '',
      dueDate: ''
    }
  });

  async function onSubmitForm(values) {
    if (isRedirecting) return;

    try {
      const createdTicket = await addNewTicket(values);
      setIsRedirecting(true);
      reset();

      setTimeout(() => {
        navigate(`/tickets/${createdTicket.id}`);
      }, 650);
    } catch (err) {
      setIsRedirecting(false);
      addToast(
        err.message ||
          'Unable to create the support ticket. Please verify your input and try again.',
        'error',
        'Ticket Creation Failed'
      );
    }
  }

  return (
    <div className="create-ticket-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Create New Ticket</h1>
          <p className="page-subtitle">
            Submit a new customer support request and assign it to an available
            support specialist
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={() => navigate('/tickets')}
        >
          <ArrowLeft size={15} />
          <span>Return to Ticket Management</span>
        </button>
      </div>

      <div className="create-form-card">
        <h2 className="form-section-title">Customer & Ticket Information</h2>

        <form
          onSubmit={handleSubmit(onSubmitForm)}
          className="ticket-form"
          noValidate
        >
          {/* Customer Name & Email */}
          <div className="form-grid-two">
            <div className="form-group">
              <label htmlFor="customerName" className="form-label">
                Customer Name <span className="required-star">*</span>
              </label>
              <input
                id="customerName"
                type="text"
                placeholder="e.g. Sarah Connor"
                className={`form-input ${
                  errors.customerName ? 'input-error' : ''
                }`}
                {...register('customerName')}
              />
              {errors.customerName && (
                <span className="field-error-msg">
                  {errors.customerName.message}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Customer Email <span className="required-star">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="e.g. sarah.connor@company.com"
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                {...register('email')}
              />
              {errors.email && (
                <span className="field-error-msg">{errors.email.message}</span>
              )}
            </div>
          </div>

          {/* Subject */}
          <div className="form-group">
            <label htmlFor="subject" className="form-label">
              Subject <span className="required-star">*</span>
            </label>
            <input
              id="subject"
              type="text"
              placeholder="Brief summary of the customer issue (5–100 characters)"
              className={`form-input ${errors.subject ? 'input-error' : ''}`}
              {...register('subject')}
            />
            {errors.subject && (
              <span className="field-error-msg">{errors.subject.message}</span>
            )}
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description <span className="required-star">*</span>
            </label>
            <textarea
              id="description"
              placeholder="Provide detailed steps to reproduce, error codes, or customer impact (minimum 10 characters)..."
              className={`form-textarea ${
                errors.description ? 'input-error' : ''
              }`}
              {...register('description')}
            />
            {errors.description && (
              <span className="field-error-msg">
                {errors.description.message}
              </span>
            )}
          </div>

          {/* Category & Priority */}
          <div className="form-grid-two">
            <div className="form-group">
              <label htmlFor="category" className="form-label">
                Category <span className="required-star">*</span>
              </label>
              <select
                id="category"
                className={`form-select ${
                  errors.category ? 'input-error' : ''
                }`}
                {...register('category')}
              >
                <option value="Technical">Technical</option>
                <option value="Billing">Billing</option>
                <option value="General">General</option>
              </select>
              {errors.category && (
                <span className="field-error-msg">
                  {errors.category.message}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="priority" className="form-label">
                Priority <span className="required-star">*</span>
              </label>
              <select
                id="priority"
                className={`form-select ${
                  errors.priority ? 'input-error' : ''
                }`}
                {...register('priority')}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
              {errors.priority && (
                <span className="field-error-msg">
                  {errors.priority.message}
                </span>
              )}
            </div>
          </div>

          {/* Assigned Agent (Only Active Agents Enabled) & Due Date */}
          <div className="form-grid-two">
            <div className="form-group">
              <label htmlFor="assignedAgent" className="form-label">
                Assigned Agent{' '}
                <span className="field-hint">(Optional — Active Agents Only)</span>
              </label>
              <select
                id="assignedAgent"
                className="form-select"
                {...register('assignedAgent')}
              >
                <option value="">Unassigned</option>
                {agents.map((agent) => {
                  const isActive = agent.status === 'Active';
                  return (
                    <option
                      key={agent.id}
                      value={agent.name}
                      disabled={!isActive}
                    >
                      {agent.name} — {agent.role}{' '}
                      {!isActive ? '(Inactive - Unavailable)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="dueDate" className="form-label">
                Due Date <span className="required-star">*</span>
              </label>
              <input
                id="dueDate"
                type="date"
                min={todayIso}
                className={`form-input ${errors.dueDate ? 'input-error' : ''}`}
                {...register('dueDate')}
              />
              {errors.dueDate && (
                <span className="field-error-msg">
                  {errors.dueDate.message}
                </span>
              )}
            </div>
          </div>

          <div className="form-actions-bar">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/tickets')}
              disabled={isSubmitting || isRedirecting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || isRedirecting}
            >
              <Send size={15} />
              <span>
                {isSubmitting || isRedirecting
                  ? 'Creating Support Ticket...'
                  : 'Create New Ticket'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTicket;
