import os
from dotenv import load_dotenv

from database.supabase_client import supabase

from repositories.sticky_note_repository import StickyNoteRepository
from repositories.task_repository import TaskRepository
from repositories.schedule_repository import ScheduleRepository
from repositories.timer_repository import TimerRepository
from repositories.busy_times_repository import BusyTimesRepository
from repositories.google_repository import GoogleRepository
from repositories.plants_repository import PlantsRepository


from services.sticky_note_service import StickyNoteService
from services.openai_service import AIService
from services.task_service import TaskService
from services.schedule_service import ScheduleService
from services.timer_service import TimerService
from services.busy_times_service import BusyTimesService
from services.stats_service import StatsService
from services.google_service import GoogleService
from services.plants_service import PlantsService
from services.pdf_parser_service import PDFParserService


load_dotenv()


# Instances
openai_service = AIService()
pdf_parser_service = PDFParserService()


task_repository = TaskRepository(supabase)
task_service = TaskService(task_repository, pdf_parser_service, openai_service)

schedule_repository = ScheduleRepository()
schedule_service = ScheduleService()

sticky_note_repository = StickyNoteRepository(supabase)
sticky_note_service = StickyNoteService(sticky_note_repository, openai_service, task_service)

timer_repository = TimerRepository(supabase)
timer_service = TimerService(timer_repository)

busy_times_repository    = BusyTimesRepository(supabase)
busy_times_service = BusyTimesService(busy_times_repository)

google_repository = GoogleRepository(supabase)
google_service = GoogleService(google_repository, busy_times_service)

plants_repository = PlantsRepository(supabase)
plants_service = PlantsService(plants_repository)

stats_service = StatsService(timer_repository, plants_repository)
