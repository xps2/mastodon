# frozen_string_literal: true

class StatusesIndex < Chewy::Index
  define_type Status do
    root date_detection: false do
      field :text, type: 'text', value: ->(status) { Formatter.instance.plaintext(status) }
      field :created_at, type: 'date'
      field :searchable_by, type: 'long'
    end
  end
end
