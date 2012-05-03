module Jekyll 
  module Filters 
    require 'pathname'

    def javascript_files(output) 
      Dir.glob('js/files/*.zip').each do |i| 
        file = Pathname.new(i).basename
        output << "- [#{file}](#{i})\n" 
      end
      output 
    end 
  end 
end 
