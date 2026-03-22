class Category < ApplicationRecord
  has_many :products, dependent: :destroy

  validates :name, presence: true, uniqueness: true
  validates :slug, presence: true, uniqueness: true

  before_validation :generate_slug, if: -> { name.present? && slug.blank? }

  scope :active, -> { where(is_active: true) }

  def generate_slug
    base_slug = name.parameterize
    # 日本語名の場合はparameterizeが空になるのでローマ字変換の代わりにIDベースで生成
    self.slug = base_slug.present? ? base_slug : "category-#{SecureRandom.hex(4)}"
  end
end