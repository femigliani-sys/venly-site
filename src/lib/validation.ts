import { z } from 'zod';
import { BRAZILIAN_STATES } from './types';

const email = z.string().trim().min(5, 'Informe um e-mail válido.').max(180).email('Informe um e-mail válido.');
const short = (max: number) => z.string().trim().max(max);

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.').max(100),
  email,
  subject: z.enum(['Geral', 'Parcerias', 'Mapas personalizados', 'Privacidade e dados pessoais', 'Loja e pedidos', 'Imprensa'], {
    errorMap: () => ({ message: 'Escolha um assunto.' }),
  }),
  message: z.string().trim().min(10, 'Descreva sua mensagem com pelo menos 10 caracteres.').max(3000),
  website: z.string().max(0).optional().default(''),
});

export const mapRequestSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome ou empresa.').max(120),
  email,
  contact: short(120).optional().default(''),
  map_type: z.string().trim().min(2, 'Selecione o tipo de mapa.').max(80),
  project_name: z.string().trim().min(2, 'Dê um nome ou ideia inicial ao projeto.').max(120),
  description: z.string().trim().min(20, 'Descreva a ideia com pelo menos 20 caracteres.').max(4000),
  refs: short(1000).optional().default(''),
  budget: short(80).optional().default(''),
  deadline: short(80).optional().default(''),
  website: z.string().max(0).optional().default(''),
});

export const orderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2, 'Informe o nome completo.').max(120),
    email,
    phone: z.string().trim().min(8, 'Informe um telefone para contato.').max(25),
    cep: z.string().trim().regex(/^\d{5}-?\d{3}$/, 'CEP inválido.'),
    street: z.string().trim().min(2, 'Informe a rua.').max(160),
    number: z.string().trim().min(1, 'Informe o número.').max(20),
    complement: short(120).optional().default(''),
    district: z.string().trim().min(2, 'Informe o bairro.').max(100),
    city: z.string().trim().min(2, 'Informe a cidade.').max(100),
    state: z.enum(BRAZILIAN_STATES as [string, ...string[]], { errorMap: () => ({ message: 'Selecione a UF.' }) }),
  }),
  items: z.array(z.object({
    slug: z.string().min(1).max(120),
    size: z.string().max(30),
    quantity: z.number().int().min(1).max(20),
  })).min(1, 'Seu carrinho está vazio.').max(40),
  notes: short(500).optional().default(''),
  website: z.string().max(0).optional().default(''),
});

export const consentSchema = z.object({
  token: z.string().min(8).max(80),
  version: z.string().min(1).max(40),
  necessary: z.boolean(),
  analytics: z.boolean(),
  ads: z.boolean(),
  action: z.enum(['accept_all', 'reject_optional', 'custom', 'withdraw', 'expired']),
});

export const loginSchema = z.object({
  email: z.string().trim().min(3).max(180).email('E-mail inválido.'),
  password: z.string().min(1, 'Informe a senha.').max(200),
});

export const categorySchema = z.object({
  type: z.enum(['map', 'product', 'member']),
  name: z.string().trim().min(2, 'Informe o nome.').max(60),
  slug: z.string().trim().max(80).optional().default(''),
  sort_order: z.number().int().min(0).max(9999).optional().default(0),
});

export const mapSchema = z.object({
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífens.'),
  title: z.string().trim().min(2).max(120),
  category: z.string().trim().min(1).max(60),
  summary: z.string().trim().max(400).optional().default(''),
  description: z.string().trim().max(8000).optional().default(''),
  status: z.enum(['Publicado', 'Em desenvolvimento', 'Projeto conceitual']),
  cover: z.string().trim().max(400).optional().default(''),
  gallery: z.array(z.string().max(400)).max(20).optional().default([]),
  video_url: z.string().trim().max(400).optional().default(''),
  featured: z.boolean().optional().default(false),
  is_demo: z.boolean().optional().default(false),
  sort_order: z.number().int().min(0).max(9999).optional().default(0),
});

export const productSchema = z.object({
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífens.'),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(5000).optional().default(''),
  price_cents: z.number().int().min(0).max(10_000_000),
  category: z.string().trim().min(1).max(60),
  images: z.array(z.string().max(400)).max(12).optional().default([]),
  sizes: z.array(z.string().max(30)).max(20).optional().default([]),
  stock: z.number().int().min(0).max(1_000_000),
  active: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
  is_demo: z.boolean().optional().default(false),
  sort_order: z.number().int().min(0).max(9999).optional().default(0),
});

export const memberSchema = z.object({
  name: z.string().trim().min(2).max(120),
  nickname: z.string().trim().max(80).optional().default(''),
  role: z.string().trim().min(2).max(120),
  game: z.string().trim().max(80).optional().default(''),
  bio: z.string().trim().max(1200).optional().default(''),
  photo: z.string().trim().max(400).optional().default(''),
  category: z.string().trim().min(1).max(80),
  socials: z.array(z.object({ label: z.string().max(40), url: z.string().max(400) })).max(10).optional().default([]),
  sort_order: z.number().int().min(0).max(9999).optional().default(0),
});

export const statusSchema = z.object({
  status: z.string().trim().min(1).max(60),
  notes: z.string().trim().max(4000).optional(),
});

export const contentSchema = z.object({
  content: z.record(z.unknown()),
});
