def parse_proxy(proxy)
  return if !proxy || proxy.empty?

  proxy = URI.parse(proxy)
  raise Mastodon::ValidationError, "Unsupported proxy type: #{proxy.scheme}" unless ["http", "https"].include? proxy.scheme
  raise Mastodon::ValidationError, "No proxy host" unless proxy.host

  proxy.host = proxy.host[1...-1] if proxy.host[0] == '[' #IPv6 address
  opthash = { proxy_address: proxy.host, proxy_port: proxy.port }
  opthash[:proxy_username] = proxy.user if proxy.user
  opthash[:proxy_password] = proxy.password if proxy.password
  ({proxy: opthash})
end

Rails.application.configure do
  config.x.http_client_proxy = {
    "http" => parse_proxy(ENV['HTTP_PROXY']) || parse_proxy(ENV['http_proxy']),
    "https" => parse_proxy(ENV['HTTPS_PROXY']) || parse_proxy(ENV['https_proxy']),
  }
end

module Mastodon
  module Goldfinger
    def self.fetch(uri)
      ssl = !(/\.(onion|i2p)(:\d+)?$/ === uri)
      proxy = Rails.configuration.x.http_client_proxy[ssl ? 'https' : 'http']
      ::Goldfinger.finger("acct:#{uri}", proxy, ssl)
    end
  end
end
