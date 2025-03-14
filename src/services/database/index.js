/**
 * Database Services Index
 * Exports all database services for centralized access
 */

// Export base operations
import * as BaseService from './base';
export { BaseService };

// Entity-specific services
import * as UserService from './user';
import * as ListingService from './listing';
import * as IndustryService from './industry';
import * as LocationService from './location';
import * as TagService from './tag';
import * as ReviewService from './review';
import * as MessageService from './message';
import * as ChatroomService from './chatroom';
import * as ActivityService from './activity';
import * as FavoriteService from './favorite';
import * as NotificationService from './notification';
import * as SubscriptionService from './subscription';
import * as PlanService from './plan';
import * as TransactionService from './transaction';
import * as PaymentMethodService from './paymentMethod';
import * as PromotionService from './promotion';
import * as AnalyticsService from './analytics';
import * as ContentPageService from './contentPage';
import * as SettingsService from './settings';
import * as EnumService from './enum';
import * as ReportService from './report';
import * as FaqService from './faq';
import * as AuditLogService from './auditLog';
import * as FeatureFlagService from './featureFlag';
import * as SupportTicketService from './supportTicket';

// Export entity-specific services
export {
  UserService,
  ListingService,
  IndustryService,
  LocationService,
  TagService,
  ReviewService,
  MessageService,
  ChatroomService,
  ActivityService,
  FavoriteService,
  NotificationService,
  SubscriptionService,
  PlanService,
  TransactionService,
  PaymentMethodService,
  PromotionService,
  AnalyticsService,
  ContentPageService,
  SettingsService,
  EnumService,
  ReportService,
  FaqService,
  AuditLogService,
  FeatureFlagService,
  SupportTicketService
};

// Complex transaction operations
import * as TransactionOperations from './transaction-operations';
export { TransactionOperations };