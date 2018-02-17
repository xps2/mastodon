# frozen_string_literal: true

require 'rubygems/package'

class BackupService < BaseService
  attr_reader :account, :backup, :collection

  def call(backup)
    @backup  = backup
    @account = backup.user.account

    build_json!
    build_archive!
  end

  private

  def build_json!
    @collection = serialize(collection_presenter, ActivityPub::CollectionSerializer)

    account.statuses.with_includes.find_in_batches do |statuses|
      statuses.each do |status|
        item = serialize(status, ActivityPub::ActivitySerializer)
        item.delete(:'@context')

        unless item[:type] == 'Announce' || item[:object][:attachment].blank?
          item[:object][:attachment].each do |attachment|
            attachment[:url] = Addressable::URI.parse(attachment[:url]).path.gsub(/\A\/system\//, '')
          end
        end

        @collection[:orderedItems] << item
      end

      GC.start
    end
  end

  def build_archive!
    tmp_file = Tempfile.new(%w(archive .tar.gz))

    File.open(tmp_file, 'wb') do |file|
      Zlib::GzipWriter.wrap(file) do |gz|
        Gem::Package::TarWriter.new(gz) do |tar|
          dump_media_attachments!(tar)
          dump_outbox!(tar)
          dump_actor!(tar)
        end
      end
    end

    @backup.dump      = tmp_file
    @backup.processed = true
    @backup.save!
  ensure
    tmp_file.close
    tmp_file.unlink
  end

  def dump_media_attachments!(tar)
    MediaAttachment.attached.where(account: account).find_in_batches do |media_attachments|
      media_attachments.each do |m|
        download_to_tar(tar, m.file, m.file.path)
      end

      GC.start
    end
  end

  def dump_outbox!(tar)
    json = Oj.dump(collection)

    tar.add_file_simple('outbox.json', 0o444, json.bytesize) do |io|
      io.write(json)
    end
  end

  def dump_actor!(tar)
    actor = serialize(account, ActivityPub::ActorSerializer)

    actor[:icon][:url]  = 'avatar' + File.extname(actor[:icon][:url])  if actor[:icon]
    actor[:image][:url] = 'header' + File.extname(actor[:image][:url]) if actor[:image]

    download_to_tar(tar, account.avatar, 'avatar' + File.extname(account.avatar.path)) if account.avatar.exists?
    download_to_tar(tar, account.header, 'header' + File.extname(account.header.path)) if account.header.exists?

    json = Oj.dump(actor)

    tar.add_file_simple('actor.json', 0o444, json.bytesize) do |io|
      io.write(json)
    end

    tar.add_file_simple('key.pem', 0o444, account.private_key.bytesize) do |io|
      io.write(account.private_key)
    end
  end

  def collection_presenter
    ActivityPub::CollectionPresenter.new(
      id: account_outbox_url(account),
      type: :ordered,
      size: account.statuses_count,
      items: []
    )
  end

  def serialize(object, serializer)
    ActiveModelSerializers::SerializableResource.new(
      object,
      serializer: serializer,
      adapter: ActivityPub::Adapter
    ).as_json
  end

  CHUNK_SIZE = 1.megabyte

  def download_to_tar(tar, attachment, filename)
    adapter = Paperclip.io_adapters.for(attachment)

    tar.add_file_simple(filename, 0o444, adapter.size) do |io|
      while buffer = adapter.read(CHUNK_SIZE)
        io.write(buffer)
      end
    end
  end
end
